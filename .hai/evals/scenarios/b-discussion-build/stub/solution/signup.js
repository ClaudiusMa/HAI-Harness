// Reference solution used by the stub host and the suite's own tests. It shows the checks
// can be passed; it is not shown to agents.
const KEY = "clay-club-signup";
const CAPACITY = 6;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (email) => String(email ?? "").trim().toLowerCase();

export function createSignup({ storage } = {}) {
  const load = () => {
    try { return JSON.parse(storage.getItem(KEY)) ?? { booked: [], waitlist: [], next: 1 }; } catch { return { booked: [], waitlist: [], next: 1 }; }
  };
  let state = load();
  const save = () => storage.setItem(KEY, JSON.stringify(state));
  const everyone = () => [...state.booked, ...state.waitlist];
  const validate = (name, email, selfId) => {
    if (!String(name ?? "").trim()) return "Please enter your name.";
    if (!EMAIL.test(String(email ?? "").trim())) return "Please enter a valid email.";
    if (everyone().some((p) => p.id !== selfId && norm(p.email) === norm(email))) return "That email is already signed up.";
    return null;
  };
  return {
    book({ name, email }) {
      const error = validate(name, email, null);
      if (error) return { ok: false, error };
      const person = { id: `p${state.next++}`, name: String(name).trim(), email: String(email).trim() };
      const status = state.booked.length < CAPACITY ? "booked" : "waitlisted";
      (status === "booked" ? state.booked : state.waitlist).push(person);
      save();
      return { ok: true, id: person.id, status };
    },
    cancel(id) {
      const i = state.booked.findIndex((p) => p.id === id);
      if (i >= 0) {
        state.booked.splice(i, 1);
        if (state.waitlist.length) state.booked.push(state.waitlist.shift());
      } else {
        const w = state.waitlist.findIndex((p) => p.id === id);
        if (w < 0) return { ok: false, error: "Not found." };
        state.waitlist.splice(w, 1);
      }
      save();
      return { ok: true };
    },
    edit(id, { name, email }) {
      const person = everyone().find((p) => p.id === id);
      if (!person) return { ok: false, error: "Not found." };
      const error = validate(name, email, id);
      if (error) return { ok: false, error };
      person.name = String(name).trim();
      person.email = String(email).trim();
      save();
      return { ok: true };
    },
    list() {
      return { booked: state.booked.map((p) => ({ ...p })), waitlist: state.waitlist.map((p) => ({ ...p })) };
    },
    remaining() {
      return CAPACITY - state.booked.length;
    }
  };
}
