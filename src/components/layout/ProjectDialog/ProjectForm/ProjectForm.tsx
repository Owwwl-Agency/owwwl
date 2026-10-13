"use client";

import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { PROJECT_BUDGETS, PROJECT_SERVICES } from "@/data/projectDialog";
import { Field } from "../Field/Field";
import styles from "./ProjectForm.module.scss";

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();

  return (
    <div role="group" aria-labelledby={id} className={styles.section} data-dialog-reveal>
      <h3 id={id} className={styles.heading}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Consent({ name, required, children }: { name: string; required?: boolean; children: ReactNode }) {
  return (
    <label className={styles.consent}>
      <input type="checkbox" name={name} required={required} className={styles.hiddenInput} />
      <span className={styles.checkbox}>
        <Image src={asset("/images/icons/check.svg")} alt="" width={14} height={14} unoptimized />
      </span>
      {children}
    </label>
  );
}

export function ProjectForm() {
  const [files, setFiles] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  const onFiles = (event: ChangeEvent<HTMLInputElement>) =>
    setFiles(Array.from(event.target.files ?? [], (file) => file.name));

  // TODO: send the enquiry to the backend.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <Section title="I need">
        <div className={styles.options}>
          {PROJECT_SERVICES.map((service) => (
            <label key={service} className={styles.option}>
              <input type="checkbox" name="services" value={service} className={styles.hiddenInput} />
              {service}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Details">
        <div className={styles.fields}>
          <Field label="Your name*" name="name" required autoComplete="name" />
          <Field label="Email*" name="email" type="email" required autoComplete="email" />
          <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
          <Field label="Company" name="company" autoComplete="organization" />
          <Field label="Describe Your Project" name="description" multiline className={styles.wide} />
        </div>
        <label className={styles.attach}>
          <input type="file" name="attachments" multiple className={styles.hiddenInput} onChange={onFiles} />
          <Image src={asset("/images/icons/paperclip.svg")} alt="" width={24} height={24} unoptimized />
          Add Attachment
        </label>
        {files.length > 0 && <p className={styles.files}>{files.join(", ")}</p>}
      </Section>

      <Section title="Budget">
        <div className={styles.options}>
          {PROJECT_BUDGETS.map((budget) => (
            <label key={budget} className={`${styles.option} ${styles.budget}`}>
              <input type="radio" name="budget" value={budget} className={styles.hiddenInput} />
              {budget}
            </label>
          ))}
        </div>
      </Section>

      <div className={styles.consents} data-dialog-reveal>
        <Consent name="privacy" required>
          I agree to the Privacy Policy
        </Consent>
        <Consent name="newsletter">Sign up to receive our newsletter.</Consent>
      </div>

      <div className={styles.actions} data-dialog-reveal>
        <button type="submit" className={styles.submit} disabled={sent}>
          {sent ? "Thank you!" : "Submit"}
        </button>
      </div>
    </form>
  );
}
