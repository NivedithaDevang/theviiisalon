import { Contact } from "../components/Contact/Contact";

export default function ContactPage() {
  return (
    <div className="contact-page">
      <Contact />
      <div className="contact-map">
        <iframe
          title="Map to THE VIII SALON in BTM Layout, Bengaluru"
          src="https://maps.google.com/maps?q=No.%2075%2C%20100%20Feet%20Ring%20Road%2C%20BTM%20Layout%202nd%20Stage%2C%20Bengaluru&t=&z=14&ie=UTF8&iwloc=&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
