import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Person = {
  name: string;
  language: string;
  phone: string;
  locationOn: boolean;
  locationShared: boolean;
  phoneVerified?: boolean;
};

const LANGUAGES = [
  "Hindi",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Urdu",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Odia",
  "Punjabi",
  "Assamese",
  "Maithili",
  "Santali",
  "Kashmiri",
  "Sindhi",
  "Konkani",
  "Dogri",
  "Nepali",
  "Manipuri",
  "Bodo",
  "Sanskrit",
  "English",
  "Other",
];

export default function DriverHelperDetails({ vehicleRegNo, onValidationChange }: { vehicleRegNo?: string; onValidationChange?: (valid: { driver: boolean; helper: boolean }) => void }) {
  const [driver, setDriver] = useState<Person>({
    name: "",
    language: "",
    phone: "",
    locationOn: false,
    locationShared: false,
  });
  const [helper, setHelper] = useState<Person>({
    name: "",
    language: "",
    phone: "",
    locationOn: false,
    locationShared: false,
  });

  // Prefill demo driver/helper details when vehicleRegNo is provided
  useEffect(() => {
    if (!vehicleRegNo) {
      setDriver({ name: '', language: '', phone: '', locationOn: false, locationShared: false })
      setHelper({ name: '', language: '', phone: '', locationOn: false, locationShared: false })
      return
    }
    const digits = vehicleRegNo.replace(/\D/g, '')
    const last4 = (digits ? digits.slice(-4) : '0001')
    const makePhone = (prefix: string) => (prefix + last4).padEnd(10, '0').slice(0, 10)
    setDriver({ name: 'John Doe', language: 'English', phone: makePhone('90000'), locationOn: false, locationShared: false, phoneVerified: false })
    setHelper({ name: 'Jane Smith', language: 'Hindi', phone: makePhone('90001'), locationOn: false, locationShared: false, phoneVerified: false })
  }, [vehicleRegNo])

  useEffect(() => {
    const dValid = driver.name.trim().length > 0 && driver.language.trim().length > 0 && driver.phone.length === 10
    const hValid = helper.name.trim().length > 0 && helper.language.trim().length > 0 && helper.phone.length === 10
    onValidationChange?.({ driver: dValid, helper: hValid })
  }, [driver, helper, onValidationChange])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Section
          title="Driver Details"
          person={driver}
          onChange={setDriver}
          prefix="driver"
        />
        <Section
          title="Helper Details"
          person={helper}
          onChange={setHelper}
          prefix="helper"
        />
      </div>
    </div>
  );
}

function Section({
  title,
  person,
  onChange,
  prefix,
}: {
  title: string;
  person: Person;
  onChange: (p: Person) => void;
  prefix: string;
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [verified, setVerified] = useState(person.phoneVerified ?? false);

  const [customDraft, setCustomDraft] = useState("");
  const [customCommitted, setCustomCommitted] = useState(false);

  useEffect(() => {
    if (person.language === "Other") {
      setCustomCommitted(false);
      setCustomDraft("");
    } else if (LANGUAGES.includes(person.language)) {
      setCustomCommitted(false);
      setCustomDraft("");
    } else if (person.language) {
      setCustomCommitted(true);
      setCustomDraft("");
    } else {
      setCustomCommitted(false);
      setCustomDraft("");
    }
  }, [person.language]);

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0,10);
    onChange({ ...person, phone: digits, phoneVerified: false });
    setVerified(false);
    setOtpSent(false);
    setGeneratedOtp("");
    setOtpInput("");
  };

  const sendOtp = () => {
    if (person.phone.length !== 10) return;
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setOtpSent(true);
    const role = prefix === 'driver' ? 'Driver' : 'Helper';
    alert(`OTP sent to ${role}'s phone number`);
  };

  const verifyOtp = () => {
    if (otpInput === generatedOtp) {
      onChange({ ...person, phoneVerified: true });
      setVerified(true);
      setOtpSent(false);
      setGeneratedOtp("");
      setOtpInput("");
    } else {
      alert("Invalid OTP");
    }
  };

  return (
    <div className="rounded-ui border border-slate-200 p-3">
      <h4 className="font-medium text-slate-700 mb-3">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label
            htmlFor={`${prefix}-name`}
            className="block text-sm text-slate-600 mb-1"
          >
            Name: <span className="text-red-600">*</span>
          </label>
          <input
            id={`${prefix}-name`}
            type="text"
            value={person.name}
            onChange={(e) => onChange({ ...person, name: e.target.value })}
            placeholder={`Enter ${prefix} name`}
            className="w-full border border-slate-300 rounded-ui px-3 py-2"
            aria-required
          />
        </div>
        <div>
          <label
            htmlFor={`${prefix}-phone`}
            className="block text-sm text-slate-600 mb-1"
          >
            Phone number: <span className="text-red-600">*</span>
          </label>
          <input
            id={`${prefix}-phone`}
            type="tel"
            value={person.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="10 digit mobile"
            className="w-full border border-slate-300 rounded-ui px-3 py-2"
            inputMode="numeric"
            maxLength={10}
            aria-required
          />
          {person.phone.length > 0 && person.phone.length !== 10 && (
            <div className="mt-1 text-xs text-red-600">Enter a valid 10 digit phone number</div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label
            htmlFor={`${prefix}-language`}
            className="block text-sm text-slate-600 mb-1"
          >
            Language spoken: <span className="text-red-600">*</span>
          </label>
          <LanguageSelect
            id={`${prefix}-language`}
            value={person.language}
            onChange={(val) => onChange({ ...person, language: val })}
            placement={prefix === 'helper' ? 'top' : 'bottom'}
            required
          />
          {(person.language === "Other" || customCommitted) && (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={customCommitted ? person.language : customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                readOnly={customCommitted}
                placeholder="Enter custom language"
                className={`flex-1 border border-slate-300 rounded-ui px-3 py-2 ${customCommitted
                    ? "bg-slate-100 text-slate-700 cursor-default"
                    : ""
                  }`}
              />
              {customCommitted ? (
                <button
                  type="button"
                  onClick={() => {
                    setCustomDraft("");
                    setCustomCommitted(false);
                    onChange({ ...person, language: "Other" });
                  }}
                  className="px-3 py-2 rounded bg-red-600 text-white"
                >
                  Clear
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const v = customDraft.trim();
                      if (v) {
                        setCustomCommitted(true);
                        onChange({ ...person, language: v });
                      }
                    }}
                    className="px-3 py-2 rounded bg-blue-600 text-white"
                  >
                    Enter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDraft("");
                      setCustomCommitted(false);
                      onChange({ ...person, language: "" });
                    }}
                    className="px-3 py-2 rounded bg-slate-200 text-slate-700"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div>
          {!verified && person.phone.length === 10 && (
            <div>
              <button
                type="button"
                onClick={sendOtp}
                className="w-full px-3 py-2 rounded bg-blue-600 text-white font-medium mb-2"
              >
                Send OTP
              </button>
            </div>
          )}

          {verified && (
            <div>
              <span className="block w-full px-3 py-2 rounded bg-green-600 text-white text-center font-medium">
                Verified
              </span>
            </div>
          )}

          {otpSent && (
            <div className="space-y-2">
              <input
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter OTP"
                className="w-full border border-slate-300 rounded-ui px-3 py-2"
              />
              <button
                onClick={verifyOtp}
                className="w-full px-3 py-2 rounded bg-green-600 text-white font-medium"
              >
                Verify
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={person.locationOn}
            onChange={(e) =>
              onChange({ ...person, locationOn: e.target.checked })
            }
          />
          <span>Location is ON on phone</span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={person.locationShared}
            onChange={(e) =>
              onChange({ ...person, locationShared: e.target.checked })
            }
          />
          <span>Location is SHARED from phone</span>
        </label>
      </div>
    </div>
  );
}

function LanguageSelect({
  id,
  value,
  onChange,
  placeholder = "Select language",
  placement = 'bottom',
  required = false,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  placement?: 'top' | 'bottom';
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(
    () =>
      LANGUAGES.filter((l) => l.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref} id={id}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        className="w-full border border-slate-300 rounded-ui px-3 py-2 bg-white flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className={`absolute z-50 w-full rounded-ui border border-slate-200 bg-white shadow-card overflow-hidden ${placement === 'top' ? 'bottom-full mb-1' : 'mt-1'}`}>
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search language..."
              className="w-full px-2 py-1.5 rounded-ui border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
            ) : (
              filtered.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    onChange(l);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${l === value ? "bg-blue-50 text-blue-700" : ""
                    }`}
                  role="option"
                  aria-selected={l === value}
                >
                  {l}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
