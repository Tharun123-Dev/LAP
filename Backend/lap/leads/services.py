from typing import Optional, List
from django.db import transaction
from .models import Lead, LeadForm, LeadField, LeadFieldValue, FollowUp


# ─── Form Services ────────────────────────────────────────────────────────────

def create_form(data: dict) -> LeadForm:
    form = LeadForm.objects.create(**data)
    return form


def get_forms(skip: int = 0, limit: int = 100):
    return LeadForm.objects.all()[skip:skip + limit]


def get_form(form_id: int) -> Optional[LeadForm]:
    try:
        return LeadForm.objects.get(id=form_id)
    except LeadForm.DoesNotExist:
        return None


def add_field(form_id: int, field_data: dict) -> LeadField:
    field = LeadField.objects.create(form_id=form_id, **field_data)
    return field


def update_field(field_id: int, field_data: dict) -> Optional[LeadField]:
    try:
        field = LeadField.objects.get(id=field_id)
    except LeadField.DoesNotExist:
        return None
    for key, value in field_data.items():
        setattr(field, key, value)
    field.save()
    return field


def delete_field(field_id: int) -> bool:
    try:
        LeadField.objects.get(id=field_id).delete()
        return True
    except LeadField.DoesNotExist:
        return False


@transaction.atomic
def sync_fields(form_id: int, fields_data: list) -> List[LeadField]:
    existing_fields = {f.id: f for f in LeadField.objects.filter(form_id=form_id)}
    synced_ids = set()

    for item in fields_data:
        raw_id = item.get('id')
        db_id = None
        if raw_id is not None:
            try:
                db_id = int(raw_id)
            except (ValueError, TypeError):
                db_id = None

        if db_id and db_id in existing_fields:
            # Update existing field
            f = existing_fields[db_id]
            for attr in ('label', 'field_type', 'required', 'placeholder',
                         'section', 'validation', 'options', 'order'):
                if attr in item:
                    setattr(f, attr, item[attr])
            f.save()
            synced_ids.add(f.id)
        else:
            # Check for core field match by label
            if item.get('is_core') or (raw_id and str(raw_id).startswith('f_')):
                core_match = next(
                    (f for f in existing_fields.values()
                     if f.is_core and f.label.lower() == item.get('label', '').lower()),
                    None
                )
                if core_match:
                    for attr in ('label', 'required', 'placeholder',
                                 'section', 'validation', 'options', 'order'):
                        if attr in item:
                            setattr(core_match, attr, item[attr])
                    core_match.save()
                    synced_ids.add(core_match.id)
                    continue

            # Create new custom field
            new_field = LeadField.objects.create(
                form_id=form_id,
                label=item.get('label', ''),
                field_type=item.get('field_type', 'text'),
                required=item.get('required', False),
                placeholder=item.get('placeholder'),
                section=item.get('section', 'General Details'),
                validation=item.get('validation'),
                is_core=False,
                options=item.get('options'),
                order=item.get('order', 0),
            )
            synced_ids.add(new_field.id)

    # Delete non-synced, non-core fields
    for fid, field in existing_fields.items():
        if fid not in synced_ids and not field.is_core:
            LeadFieldValue.objects.filter(field_id=fid).delete()
            field.delete()

    return list(LeadField.objects.filter(form_id=form_id).order_by('order'))


# ─── Lead Services ────────────────────────────────────────────────────────────

@transaction.atomic
def create_lead(data: dict) -> Lead:
    dynamic_fields = data.pop('dynamic_fields', [])
    lead = Lead.objects.create(**data)
    for fv in dynamic_fields:
        LeadFieldValue.objects.create(
            lead_id=lead.id,
            field_id=fv['field_id'],
            value=fv['value']
        )
    return Lead.objects.select_related('counselor', 'form').prefetch_related(
        'field_values__field'
    ).get(id=lead.id)


def get_leads(skip: int = 0, limit: int = 100, counselor_id=None, tenant_id=None):
    qs = Lead.objects.select_related('counselor', 'form').prefetch_related(
        'field_values__field'
    )
    if counselor_id:
        qs = qs.filter(counselor_id=counselor_id)
    if tenant_id:
        qs = qs.filter(tenant_id=tenant_id)
    return qs[skip:skip + limit]


def get_lead(lead_id: int) -> Optional[Lead]:
    try:
        return Lead.objects.select_related('counselor', 'form').prefetch_related(
            'field_values__field'
        ).get(id=lead_id)
    except Lead.DoesNotExist:
        return None


@transaction.atomic
def update_lead(lead_id: int, data: dict) -> Optional[Lead]:
    try:
        lead = Lead.objects.get(id=lead_id)
    except Lead.DoesNotExist:
        return None

    dynamic_fields = data.pop('dynamic_fields', None)
    for key, value in data.items():
        setattr(lead, key, value)
    lead.save()

    if dynamic_fields is not None:
        LeadFieldValue.objects.filter(lead_id=lead_id).delete()
        for fv in dynamic_fields:
            LeadFieldValue.objects.create(
                lead_id=lead_id,
                field_id=fv['field_id'],
                value=fv['value']
            )

    return Lead.objects.select_related('counselor', 'form').prefetch_related(
        'field_values__field'
    ).get(id=lead_id)


def delete_lead(lead_id: int) -> bool:
    try:
        Lead.objects.get(id=lead_id).delete()
        return True
    except Lead.DoesNotExist:
        return False


def assign_counselor(lead_id: int, counselor_id: int) -> Optional[Lead]:
    try:
        lead = Lead.objects.get(id=lead_id)
        lead.counselor_id = counselor_id
        lead.save()
        return lead
    except Lead.DoesNotExist:
        return None


# ─── FollowUp Services ────────────────────────────────────────────────────────

def create_followup(data: dict, counselor_id: int) -> FollowUp:
    followup = FollowUp.objects.create(**data, counselor_id=counselor_id)
    return followup


def get_followups(lead_id=None, counselor_id=None):
    qs = FollowUp.objects.select_related('lead', 'counselor')
    if lead_id:
        qs = qs.filter(lead_id=lead_id)
    if counselor_id:
        qs = qs.filter(counselor_id=counselor_id)
    return qs


def update_followup(followup_id: int, data: dict) -> Optional[FollowUp]:
    try:
        f = FollowUp.objects.get(id=followup_id)
    except FollowUp.DoesNotExist:
        return None
    for key, value in data.items():
        setattr(f, key, value)
    f.save()
    return f