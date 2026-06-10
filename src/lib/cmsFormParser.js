export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseCmsFormBody(body, config) {
  const payload = {};

  for (const field of config.fields) {
    const raw = body[field.name];
    if (raw === undefined) {
      continue;
    }

    if (field.jsonArray) {
      payload[field.name] = String(raw)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      continue;
    }

    if (field.jsonOutcomes) {
      try {
        payload[field.name] = JSON.parse(raw);
      } catch {
        payload[field.name] = [];
      }
      continue;
    }

    if (field.name === 'featured') {
      payload[field.name] = raw === 'true' || raw === true;
      continue;
    }

    if (['is_child_related', 'submit_for_review'].includes(field.name)) {
      continue;
    }

    if (field.name === 'consent_status' && config.key === 'gallery') {
      continue;
    }

    if (field.type === 'number') {
      payload[field.name] = raw === '' ? null : Number(raw);
      continue;
    }

    payload[field.name] = raw;
  }

  if (payload.title && config.slugField && !payload[config.slugField]) {
    payload[config.slugField] = slugify(payload.title);
  }

  return payload;
}

export function serializeRecordForForm(record, config) {
  if (!record) {
    return {};
  }

  const values = { ...record };

  for (const field of config.fields) {
    if (field.jsonArray && Array.isArray(values[field.name])) {
      values[field.name] = values[field.name].join('\n');
    }
    if (field.jsonOutcomes && Array.isArray(values[field.name])) {
      values[field.name] = JSON.stringify(values[field.name], null, 2);
    }
    if (field.name === 'featured') {
      values[field.name] = values[field.name] ? 'true' : 'false';
    }
  }

  return values;
}

export default {
  slugify,
  parseCmsFormBody,
  serializeRecordForForm,
};
