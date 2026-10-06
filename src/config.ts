// Use the SAME values as the website (js/config.js): Supabase Dashboard > Project Settings > API.
// The anon key is meant to be public. Never put the service role key here.
export const SUPABASE_URL = 'https://wjiimjbfgmarbigyptio.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaWltamJmZ21hcmJpZ3lwdGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODMxODksImV4cCI6MjEwNjQ1OTE4OX0.Oh9ItJqDmiQ1yyvJiLtdAENKlG8zDJ4lHxLgxAfKTNw';

// Your live website, used for the "Open the website" link.
export const WEB_URL = 'https://akweteshop.vercel.app';

export const CONFIGURED = !/YOUR_/.test(SUPABASE_URL + SUPABASE_ANON_KEY);
