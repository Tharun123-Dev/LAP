import React from 'react';

const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Interested',
  'Follow-Up Pending',
  'Admission Confirmed',
  'Rejected',
];

export default function DynamicFormRenderer({
  fields = [],
  counselors = [],
  leadOptions,
  defaultValues,
  onSubmit,
  buttonText,
}) {
  const [values, setValues] = React.useState(defaultValues || {});
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    setValues(defaultValues || {});
    setErrors({});
  }, [defaultValues]);

  const setValue = (fieldId, value) => {
    setValues((current) => ({ ...current, [String(fieldId)]: value }));
  };

  const handleCheckboxValue = (fieldId, option, checked) => {
    const key = String(fieldId);
    const current = Array.isArray(values[key]) ? values[key] : [];
    setValue(
      key,
      checked ? [...current, option] : current.filter((item) => item !== option)
    );
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    fields.forEach((field) => {
      const key = String(field.id);
      const value = values[key];
      if (field.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
        nextErrors[key] = true;
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit?.(values);
    }
  };

  const commonClasses =
    'w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm text-slate-800 dark:text-slate-200 transition-all duration-150';

  const statusOptions = Array.isArray(leadOptions?.statuses) && leadOptions.statuses.length
    ? leadOptions.statuses.map((item) => item.value || item.label)
    : LEAD_STATUSES;

  const renderField = (field) => {
    const fType = field.field_type || field.type;
    const fieldLabel = (field.label || '').toLowerCase().trim();

    // ── Special: Assigned Counselor → dynamic dropdown from DB ──
    if (fieldLabel === 'assigned counselor') {
      return (
        <select
          value={values[String(field.id)] || ''}
          onChange={(event) => setValue(field.id, event.target.value)}
          className={commonClasses}
        >
          <option value="">— Select Counselor —</option>
          {counselors.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.full_name}
              {c.role === 'admin' ? '  (Admin)' : ''}
            </option>
          ))}
        </select>
      );
    }

    // ── Special: Status → fixed status dropdown ──
    if (fieldLabel === 'status') {
      return (
        <select
          value={values[String(field.id)] || ''}
          onChange={(event) => setValue(field.id, event.target.value)}
          className={commonClasses}
        >
          <option value="">— Select Status —</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      );
    }

    // ── Map backend field_type to HTML input type ──
    let htmlType = fType;
    if (htmlType === 'date picker') htmlType = 'date';
    if (htmlType === 'number') htmlType = 'number';

    switch (fType) {
      case 'dropdown':
        return (
          <select
            value={values[String(field.id)] || ''}
            onChange={(event) => setValue(field.id, event.target.value)}
            className={commonClasses}
          >
            <option value="">{field.placeholder || 'Enter value'}</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="flex flex-wrap gap-4 pt-1">
            {(field.options || []).map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <input
                  type="radio"
                  name={String(field.id)}
                  value={opt}
                  checked={values[String(field.id)] === opt}
                  onChange={(event) => setValue(field.id, event.target.value)}
                  className="accent-indigo-600"
                />
                {opt}
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex flex-wrap gap-4 pt-1">
            {(field.options || []).map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={(values[String(field.id)] || []).includes(opt)}
                  onChange={(event) => handleCheckboxValue(field.id, opt, event.target.checked)}
                  className="accent-indigo-600 w-4 h-4"
                />
                {opt}
              </label>
            ))}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={values[String(field.id)] || ''}
            onChange={(event) => setValue(field.id, event.target.value)}
            placeholder={field.placeholder || ''}
            rows={3}
            className={`${commonClasses} resize-none`}
          />
        );

      default:
        return (
          <input
            type={htmlType || 'text'}
            value={values[String(field.id)] || ''}
            onChange={(event) => setValue(field.id, event.target.value)}
            placeholder={field.placeholder || ''}
            className={commonClasses}
          />
        );
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide">
            {field.label}{' '}
            {field.required && <span className="text-rose-500">*</span>}
          </label>
          {renderField(field)}
          {errors[String(field.id)] && (
            <span className="text-[11px] text-rose-500 font-medium">
              This field is required
            </span>
          )}
        </div>
      ))}

      <button
        type="submit"
        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20 mt-2"
      >
        {buttonText}
      </button>
    </form>
  );
}
