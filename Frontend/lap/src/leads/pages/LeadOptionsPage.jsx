import React from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const emptyOption = () => ({
  id: null,
  label: '',
  value: '',
});

const optionValue = (label) => label.trim();

function OptionEditor({ title, items, setItems, placeholder }) {
  const updateItem = (index, key, value) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
              value: key === 'label' && (!item.value || item.value === optionValue(item.label || ''))
                ? optionValue(value)
                : item.value,
            }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((current) => [...current, emptyOption()]);
  };

  const removeItem = (index) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveItem = (index, direction) => {
    setItems((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">{items.length} active options</p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-300"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id || `new-${index}`}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 sm:grid-cols-[1fr_1fr_104px] dark:border-slate-800 dark:bg-slate-950/30"
          >
            <input
              value={item.label || ''}
              onChange={(event) => updateItem(index, 'label', event.target.value)}
              placeholder={placeholder}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              value={item.value || ''}
              onChange={(event) => updateItem(index, 'value', event.target.value)}
              placeholder="Saved value"
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                title="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                title="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                title="Delete option"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LeadOptionsPage() {
  const { leadOptions, saveLeadOptions } = useApp();
  const [statuses, setStatuses] = React.useState([]);
  const [contactMethods, setContactMethods] = React.useState([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setStatuses((leadOptions.statuses || []).map((item) => ({ ...item })));
    setContactMethods((leadOptions.contact_methods || []).map((item) => ({ ...item })));
  }, [leadOptions]);

  const clean = (items, category) =>
    items
      .map((item, index) => ({
        ...item,
        category,
        label: (item.label || item.value || '').trim(),
        value: (item.value || item.label || '').trim(),
        sort_order: index + 1,
      }))
      .filter((item) => item.label && item.value);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveLeadOptions({
        statuses: clean(statuses, 'status'),
        contact_methods: clean(contactMethods, 'contact_method'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Lead Dropdown Settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage the statuses and contact methods used in lead forms, filters, and follow-up logging.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <OptionEditor
          title="Lead Statuses"
          items={statuses}
          setItems={setStatuses}
          placeholder="Status label"
        />
        <OptionEditor
          title="Contact Methods"
          items={contactMethods}
          setItems={setContactMethods}
          placeholder="Contact method label"
        />
      </div>
    </div>
  );
}
