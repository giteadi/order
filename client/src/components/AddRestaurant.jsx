import { useState } from "react";
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Hash,
  LayoutGrid,
  ChevronLeft,
  Loader2,
  Utensils,
  Link,
  FileText,
  User,
  Lock,
  Shield,
} from "lucide-react";
import apiClient from "../services/api";
import toast from "react-hot-toast";

export default function AddRestaurant({ onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    domain: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    tableCount: "",
    tableCapacity: 4,
    // Admin credentials
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const handleChange = (key, value) => {
    setFormData((p) => ({ ...p, [key]: value }));
    if (touched[key]) {
      setErrors((p) => ({ ...p, [key]: value ? null : "Required" }));
    }
  };

  const handleBlur = (key) => {
    setTouched((p) => ({ ...p, [key]: true }));
    if (!formData[key] && ["name", "subdomain"].includes(key)) {
      setErrors((p) => ({ ...p, [key]: "Required" }));
    }
  };

  const validate = () => {
    const e = {};
    if (!formData.name) e.name = "Restaurant name is required";
    if (!formData.subdomain) e.subdomain = "Subdomain is required";
    if (!formData.adminName) e.adminName = "Admin name is required";
    if (!formData.adminEmail && !formData.adminPhone) e.adminEmail = "Admin email or phone is required";
    if (!formData.adminPassword) e.adminPassword = "Admin password is required";
    if (formData.adminPassword && formData.adminPassword.length < 6) e.adminPassword = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setStatus(null);
    try {
      const response = await apiClient.post("/admin/restaurants", {
        name: formData.name,
        subdomain: formData.subdomain,
        domain: formData.domain || null,
        description: formData.description || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        table_count: formData.tableCount ? parseInt(formData.tableCount) : null,
        table_capacity: formData.tableCapacity || 4,
        // Admin credentials
        admin_name: formData.adminName,
        admin_email: formData.adminEmail || null,
        admin_phone: formData.adminPhone || null,
        admin_password: formData.adminPassword,
      });
      if (response.data.success) {
        toast.success("Restaurant created successfully!");
        setTimeout(() => onSuccess?.(response.data.data), 800);
      } else {
        toast.error(response.data.message || "Failed to create restaurant");
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filledCount = Object.values(formData).filter(v => v !== "" && v !== 4).length;
  const totalFields = Object.keys(formData).length - 1; // exclude tableCapacity default
  const progress = Math.round((filledCount / totalFields) * 100);

  return (
    <div style={styles.page}>
      {/* ── SCROLLABLE BODY ── */}
      <main style={styles.main}>
        <div style={styles.container}>

          {/* Page title */}
          <div style={styles.pageTitle}>
            <h1 style={styles.h1}>Add Restaurant</h1>
            <p style={styles.subtitle}>Fill in the details to onboard a new restaurant to the platform.</p>
          </div>

          {/* ── SECTION: Basic Info ── */}
          <Section label="01" title="Basic Info" icon={<Building2 size={14} />}>
            <div style={styles.grid2}>
              <Field
                label="Restaurant Name"
                required
                icon={<Utensils size={13} />}
                error={errors.name}
              >
                <input
                  style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
                  placeholder="e.g. The Golden Fork"
                  value={formData.name}
                  onChange={e => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                />
              </Field>

              <Field
                label="Subdomain"
                required
                icon={<Hash size={13} />}
                hint=".yourdomain.com"
                error={errors.subdomain}
              >
                <div style={styles.inputGroup}>
                  <input
                    style={{ ...styles.input, ...styles.inputGroupInput, ...(errors.subdomain ? styles.inputError : {}) }}
                    placeholder="golden-fork"
                    value={formData.subdomain}
                    onChange={e => handleChange("subdomain", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    onBlur={() => handleBlur("subdomain")}
                  />
                  <span style={styles.inputSuffix}>.menu.app</span>
                </div>
              </Field>
            </div>

            <Field label="Custom Domain" icon={<Globe size={13} />}>
              <input
                style={styles.input}
                placeholder="e.g. menu.goldenfork.com"
                value={formData.domain}
                onChange={e => handleChange("domain", e.target.value)}
              />
            </Field>

            <Field label="Description" icon={<FileText size={13} />}>
              <textarea
                style={styles.textarea}
                placeholder="Brief description of the restaurant…"
                value={formData.description}
                onChange={e => handleChange("description", e.target.value)}
                rows={3}
              />
            </Field>
          </Section>

          {/* ── SECTION: Contact ── */}
          <Section label="02" title="Contact Info" icon={<MapPin size={14} />}>
            <Field label="Address" icon={<MapPin size={13} />}>
              <input
                style={styles.input}
                placeholder="Street address, city, state"
                value={formData.address}
                onChange={e => handleChange("address", e.target.value)}
              />
            </Field>

            <div style={styles.grid2}>
              <Field label="Phone" icon={<Phone size={13} />}>
                <input
                  style={styles.input}
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={e => handleChange("phone", e.target.value)}
                />
              </Field>

              <Field label="Email" icon={<Mail size={13} />}>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="contact@restaurant.com"
                  value={formData.email}
                  onChange={e => handleChange("email", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Website" icon={<Link size={13} />}>
              <input
                style={styles.input}
                placeholder="https://goldenfork.com"
                value={formData.website}
                onChange={e => handleChange("website", e.target.value)}
              />
            </Field>
          </Section>

          {/* ── SECTION: Tables ── */}
          <Section label="03" title="Table Setup" icon={<LayoutGrid size={14} />}>
            <div style={styles.grid2}>
              <Field label="Total Tables" icon={<LayoutGrid size={13} />}>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  placeholder="e.g. 20"
                  value={formData.tableCount}
                  onChange={e => handleChange("tableCount", e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                />
              </Field>

              <Field label="Seats per Table" icon={<Utensils size={13} />}>
                <div style={styles.seatSelector}>
                  {[2, 4, 6, 8].map(n => (
                    <button
                      key={n}
                      style={{
                        ...styles.seatBtn,
                        ...(formData.tableCapacity === n ? styles.seatBtnActive : {})
                      }}
                      onClick={() => handleChange("tableCapacity", n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p style={styles.fieldHint}>{formData.tableCapacity} seats selected</p>
              </Field>
            </div>

            {formData.tableCount && (
              <div style={styles.tableSummary}>
                <LayoutGrid size={13} style={{ color: "#7c3aed" }} />
                <span>
                  <strong>{formData.tableCount} tables</strong> × <strong>{formData.tableCapacity} seats</strong> = <strong>{formData.tableCount * formData.tableCapacity} total capacity</strong>
                </span>
              </div>
            )}
          </Section>

          {/* ── SECTION: Admin Credentials ── */}
          <Section label="04" title="Admin Credentials" icon={<Shield size={14} />}>
            <div style={styles.adminNote}>
              <Shield size={13} style={{ color: "#7c3aed" }} />
              <span>Create admin account for this restaurant. Admin can manage menu, orders, and settings.</span>
            </div>

            <Field
              label="Admin Name"
              required
              icon={<User size={13} />}
              error={errors.adminName}
            >
              <input
                style={{ ...styles.input, ...(errors.adminName ? styles.inputError : {}) }}
                placeholder="e.g. John Doe"
                value={formData.adminName}
                onChange={e => handleChange("adminName", e.target.value)}
                onBlur={() => handleBlur("adminName")}
              />
            </Field>

            <div style={styles.grid2}>
              <Field
                label="Admin Email"
                icon={<Mail size={13} />}
                hint="(Email or Phone required)"
                error={errors.adminEmail}
              >
                <input
                  style={{ ...styles.input, ...(errors.adminEmail ? styles.inputError : {}) }}
                  type="email"
                  placeholder="admin@restaurant.com"
                  value={formData.adminEmail}
                  onChange={e => handleChange("adminEmail", e.target.value)}
                  onBlur={() => handleBlur("adminEmail")}
                />
              </Field>

              <Field
                label="Admin Phone"
                icon={<Phone size={13} />}
                hint="(Email or Phone required)"
              >
                <input
                  style={styles.input}
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={formData.adminPhone}
                  onChange={e => handleChange("adminPhone", e.target.value.replace(/\D/g, ""))}
                />
              </Field>
            </div>

            <Field
              label="Admin Password"
              required
              icon={<Lock size={13} />}
              hint="(min 6 characters)"
              error={errors.adminPassword}
            >
              <input
                style={{ ...styles.input, ...(errors.adminPassword ? styles.inputError : {}) }}
                type="password"
                placeholder="••••••••"
                value={formData.adminPassword}
                onChange={e => handleChange("adminPassword", e.target.value)}
                onBlur={() => handleBlur("adminPassword")}
              />
            </Field>
          </Section>

          {/* ── ACTIONS ── */}
          <div style={styles.actions}>
            <button onClick={onBack} style={styles.cancelBtn}>Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnDisabled : {}) }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} style={styles.spin} />
                  Creating…
                </>
              ) : (
                <>
                  <Building2 size={14} />
                  Create Restaurant
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

/* ── SUB-COMPONENTS ── */

function Section({ label, title, icon, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionNum}>{label}</span>
        <div style={styles.sectionIcon}>{icon}</div>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <div style={styles.sectionLine} />
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Field({ label, required, icon, hint, error, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>
        <span style={styles.fieldIcon}>{icon}</span>
        {label}
        {required && <span style={styles.requiredDot}>*</span>}
        {hint && <span style={styles.fieldHintInline}>{hint}</span>}
      </label>
      {children}
      {error && (
        <p style={styles.errorMsg}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

/* ── STYLES ── */

const styles = {
  page: {
    background: "#f6f5f3",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    minHeight: "100vh",
    height: "100%",
    overflow: "auto",
    width: "100%",
    maxWidth: "100vw",
    overflowX: "hidden",
  },
  main: {
    padding: "24px 16px 80px",
    minHeight: "100%",
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
  },
  container: {
    maxWidth: 720,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
    paddingLeft: 16,
    paddingRight: 16,
  },
  pageTitle: {
    marginBottom: 16,
  },
  h1: {
    fontSize: 26,
    fontWeight: 700,
    color: "#0f0e0d",
    letterSpacing: "-0.5px",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: 14,
    color: "#7a7370",
    margin: 0,
  },
  section: {
    background: "white",
    borderRadius: 14,
    border: "1px solid #eae7e2",
    overflow: "hidden",
    marginBottom: 12,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 20px",
    borderBottom: "1px solid #f0ece6",
    background: "#faf9f7",
  },
  sectionNum: {
    fontSize: 10,
    fontWeight: 800,
    color: "#c4bfb8",
    letterSpacing: "0.05em",
    fontFamily: "monospace",
  },
  sectionIcon: {
    width: 26,
    height: 26,
    background: "#f3f0ff",
    border: "1px solid #e4deff",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7c3aed",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#2d2a26",
    margin: 0,
    flex: 1,
  },
  sectionLine: {
    height: 1,
    flex: 0,
    width: 0,
  },
  sectionBody: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  fieldLabel: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    fontWeight: 600,
    color: "#5a5652",
    letterSpacing: "0.01em",
  },
  fieldIcon: {
    color: "#9c98f0",
    display: "flex",
  },
  requiredDot: {
    color: "#e45c3a",
    fontSize: 14,
    lineHeight: 1,
  },
  fieldHintInline: {
    fontSize: 10,
    color: "#b0aaa4",
    fontWeight: 400,
    marginLeft: 2,
  },
  fieldHint: {
    fontSize: 11,
    color: "#9a9590",
    margin: "3px 0 0",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    fontSize: 13,
    color: "#1a1a1a",
    background: "#faf9f8",
    border: "1.5px solid #e8e3dc",
    borderRadius: 8,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
  },
  inputError: {
    borderColor: "#f87171",
    background: "#fff8f8",
  },
  inputGroup: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid #e8e3dc",
    borderRadius: 8,
    overflow: "hidden",
    background: "#faf9f8",
  },
  inputGroupInput: {
    border: "none",
    background: "transparent",
    borderRadius: 0,
    flex: 1,
  },
  inputSuffix: {
    padding: "9px 10px",
    fontSize: 12,
    color: "#9c98f0",
    fontWeight: 600,
    background: "#f3f0ff",
    borderLeft: "1.5px solid #e8e3dc",
    whiteSpace: "nowrap",
  },
  textarea: {
    width: "100%",
    padding: "9px 12px",
    fontSize: 13,
    color: "#1a1a1a",
    background: "#faf9f8",
    border: "1.5px solid #e8e3dc",
    borderRadius: 8,
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.5,
  },
  errorMsg: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "#dc2626",
    margin: 0,
    fontWeight: 500,
  },
  seatSelector: {
    display: "flex",
    gap: 8,
  },
  seatBtn: {
    flex: 1,
    padding: "8px 4px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6b6560",
    background: "#faf9f8",
    border: "1.5px solid #e8e3dc",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  seatBtnActive: {
    background: "#f3f0ff",
    border: "1.5px solid #7c3aed",
    color: "#7c3aed",
  },
  tableSummary: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "#faf8ff",
    border: "1px dashed #c4b5fd",
    borderRadius: 8,
    fontSize: 13,
    color: "#4b3f72",
  },
  adminNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 14px",
    background: "#faf8ff",
    border: "1px solid #e4deff",
    borderRadius: 8,
    fontSize: 12,
    color: "#5b4a7d",
    lineHeight: 1.5,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    padding: "16px 0 8px",
  },
  cancelBtn: {
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6b6560",
    background: "white",
    border: "1.5px solid #e0dbd4",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 20px",
    fontSize: 13,
    fontWeight: 700,
    color: "white",
    background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
    transition: "all 0.15s",
  },
  submitBtnDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  spin: {
    animation: "spin 0.8s linear infinite",
  },
};

// Inject spin keyframe
const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  input:focus, textarea:focus {
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
    background: white !important;
  }
  button:hover:not(:disabled) { opacity: 0.88; }
`;
document.head.appendChild(styleTag);