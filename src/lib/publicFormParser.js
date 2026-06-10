export function parseVolunteerApplication(body) {
  const firstName = body.first_name?.trim();
  const lastName = body.last_name?.trim();
  const email = body.email?.trim();

  if (!firstName || !lastName || !email) {
    const error = new Error('First name, last name, and email are required.');
    error.status = 400;
    error.expose = true;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Please enter a valid email address.');
    error.status = 400;
    error.expose = true;
    throw error;
  }

  return {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: body.phone?.trim() || null,
    interest_area: body.interest_area?.trim() || null,
    availability: body.availability?.trim() || null,
    message: body.message?.trim() || null,
  };
}

export function parseSponsorshipRequest(body) {
  const firstName = body.first_name?.trim();
  const lastName = body.last_name?.trim();
  const email = body.email?.trim();

  if (!firstName || !lastName || !email) {
    const error = new Error('First name, last name, and email are required.');
    error.status = 400;
    error.expose = true;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Please enter a valid email address.');
    error.status = 400;
    error.expose = true;
    throw error;
  }

  return {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: body.phone?.trim() || null,
    tier_name: body.tier_name?.trim() || null,
    monthly_amount: body.monthly_amount?.trim() || null,
    message: body.message?.trim() || null,
  };
}

export default {
  parseVolunteerApplication,
  parseSponsorshipRequest,
};
