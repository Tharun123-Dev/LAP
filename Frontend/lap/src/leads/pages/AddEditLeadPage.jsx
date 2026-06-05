import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useApp } from '../context/AppContext';
import DynamicFormRenderer from '../components/Common/DynamicFormRenderer';
import { ArrowLeft, UserPlus, ClipboardEdit } from 'lucide-react';

export default function AddEditLeadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, forms, formFields, counselors, leadOptions, addLead, updateLead } = useApp();
  const { permissions = [] } = useSelector((state) => state.auth || {});
  const hasAny = (...codes) => codes.some((code) => permissions.includes(code));
  const canAssign = hasAny('assign_lead');

  const isEditMode = !!id;
  const leadToEdit = isEditMode ? leads.find(l => String(l.id) === id) : null;

  const [selectedFormId, setSelectedFormId] = React.useState(null);
  const [assignment, setAssignment] = React.useState('');

  React.useEffect(() => {
    if (forms && forms.length > 0 && selectedFormId === null) {
      if (isEditMode && leadToEdit?.form_id && forms.some((form) => form.id === leadToEdit.form_id)) {
        setSelectedFormId(leadToEdit.form_id);
      } else {
        const activeForm = forms.find(f => f.name === "Active Intake Form");
        setSelectedFormId(activeForm ? activeForm.id : forms[0].id);
      }
    }
  }, [forms, selectedFormId, isEditMode, leadToEdit]);

  React.useEffect(() => {
    if (!forms?.length || selectedFormId === null) return;
    if (!forms.some((form) => form.id === selectedFormId)) {
      const activeForm = forms.find(f => f.name === "Active Intake Form");
      setSelectedFormId(activeForm ? activeForm.id : forms[0].id);
    }
  }, [forms, selectedFormId]);

  React.useEffect(() => {
    if (!leadToEdit) return;
    setAssignment(leadToEdit.counselor_id ? String(leadToEdit.counselor_id) : '');
  }, [leadToEdit]);

  const activeFields = React.useMemo(() => {
    if (!forms || forms.length === 0) return formFields;
    const form = forms.find(f => f.id === selectedFormId);
    if (form) return form.fields;
    const activeForm = forms.find(f => f.name === "Active Intake Form");
    return activeForm ? activeForm.fields : forms[0].fields;
  }, [forms, selectedFormId, formFields]);

  // Render error state if edit ID specified but lead not found
  if (isEditMode && !leadToEdit) {
    return (
      <div className="glass-panel p-12 text-center rounded-3xl space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Lead Record Not Found</h3>
        <p className="text-xs text-slate-400">The lead you are trying to edit does not exist or was deleted.</p>
        <Link to="/dashboard/leads" className="text-xs font-bold text-indigo-500 hover:underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  // Prep initial form values
  const getInitialValues = () => {
    if (!isEditMode) return {};

    const values = {
      // Map core fields if they exist in leadToEdit
      ...activeFields.reduce((acc, field) => {
        const label = (field.label || '').toLowerCase().trim();
        if (label === "student full name") acc[field.id] = leadToEdit.full_name;
        else if (label === "email address") acc[field.id] = leadToEdit.email;
        else if (label === "phone number") acc[field.id] = leadToEdit.phone;
        else if (label === "status") acc[field.id] = leadToEdit.status;
        else if (label === "assigned counselor") acc[field.id] = leadToEdit.counselor_id ? String(leadToEdit.counselor_id) : '';
        return acc;
      }, {})
    };

    // Map dynamic field values
    leadToEdit.field_values.forEach(fv => {
      values[fv.field_id] = fv.value;
    });

    return values;
  };

  const handleFormSubmit = async (data) => {
    // 1. Identify core fields by label or is_core
    const coreData = {
      full_name: 'Unknown Lead',
      email: null,
      phone: null,
      status: 'New',
      form_id: selectedFormId || (forms && forms[0]?.id) || null,
      dynamic_fields: []
    };

    activeFields.forEach(field => {
      const val = data[String(field.id)];
      const label = (field.label || '').toLowerCase().trim();
      if (label === "student full name" && val) coreData.full_name = val;
      else if (label === "email address") coreData.email = val || null;
      else if (label === "phone number") coreData.phone = val || null;
      else if (label === "status") coreData.status = val || 'New';
      else if (label === "assigned counselor") {
        coreData.counselor_id = val ? Number(val) : null;
      } else {
        // Dynamic field
        if (val !== undefined && val !== null && val !== '') {
          coreData.dynamic_fields.push({
            field_id: field.id,
            value: String(val)
          });
        }
      }
    });

    if (canAssign) {
      coreData.counselor_id = assignment ? Number(assignment) : coreData.counselor_id || null;
    }

    try {
      if (isEditMode) {
        await updateLead({
          id: leadToEdit.id,
          ...coreData
        });
        navigate(`/dashboard/leads/${leadToEdit.id}`);
      } else {
        await addLead(coreData);
        navigate('/dashboard/leads');
      }
    } catch (error) {
      console.error('Failed to save lead:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link 
          to={isEditMode ? `/dashboard/leads/${leadToEdit.id}` : "/dashboard/leads"}
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Go Back
        </Link>
      </div>

      {/* Page Title Panel */}
      <div className="glass-panel p-6 rounded-3xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
          {isEditMode ? <ClipboardEdit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">
            {isEditMode ? `Modify Details: ${leadToEdit.full_name || 'Unknown Lead'}` : 'Register New Student Lead'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 mb-3">
            {isEditMode ? 'Make adjustments to lead status or custom fields answers below.' : 'Populate details to assign counselor and course preferences.'}
          </p>
          {!isEditMode && forms && forms.length > 0 && selectedFormId && (
            <select 
              value={selectedFormId || ''}
              onChange={(e) => setSelectedFormId(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {forms.filter(f => f.name === "Active Intake Form").map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Form Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
        {canAssign && (
        <div className="mb-6 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/30">
          {canAssign && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Assign Counselor
              </label>
              <select
                value={assignment}
                onChange={(event) => setAssignment(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="">Unassigned</option>
                {counselors.map((counselor) => (
                  <option key={counselor.id} value={String(counselor.id)}>
                    {counselor.full_name} {counselor.email ? `(${counselor.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        )}
        <DynamicFormRenderer
          key={selectedFormId}
          fields={activeFields}
          counselors={counselors}
          leadOptions={leadOptions}
          defaultValues={getInitialValues()}
          onSubmit={handleFormSubmit}
          buttonText={isEditMode ? "Save Changes" : "Create Lead"}
        />
      </div>
    </div>
  );
}
