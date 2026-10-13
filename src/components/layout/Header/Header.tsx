import Image from "next/image";
import { asset } from "@/lib/asset";
import Link from "next/link";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="Owwwl agency — home">
        <Image src={asset("/images/brand/logo-dark.svg")} alt="" width={100} height={30} unoptimized preload />
      </Link>
    </header>
  );
}
