import styles from "./Field.module.scss";

type FieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "tel";
  required?: boolean;
  autoComplete?: string;
  multiline?: boolean;
  className?: string;
};

/** An underlined input whose label sits on the line and floats up once the field is in use. */
export function Field({ label, type = "text", multiline, className, ...control }: FieldProps) {
  return (
    <label className={className ? `${styles.field} ${className}` : styles.field}>
      {multiline ? (
        <textarea {...control} rows={1} placeholder=" " className={styles.control} />
      ) : (
        <input {...control} type={type} placeholder=" " className={styles.control} />
      )}
      <span className={styles.label}>{label}</span>
    </label>
  );
}
