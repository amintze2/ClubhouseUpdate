import type { Contact } from "@/lib/types";

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <div className="shrink-0 bg-white border border-gray-100 rounded-xl px-4 py-3 min-w-[160px] max-w-[200px]">
      <p className="text-sm font-semibold text-gray-900 truncate">{contact.contact_name}</p>
      <p className="text-xs text-gray-500 truncate mb-2">{contact.contact_role}</p>
      <div className="flex flex-col gap-1">
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
          >
            <span>📞</span>
            <span>{contact.phone}</span>
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
          >
            <span>✉</span>
            <span className="truncate">{contact.email}</span>
          </a>
        )}
      </div>
    </div>
  );
}
