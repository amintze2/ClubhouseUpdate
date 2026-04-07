import type { LeagueContact } from "@/lib/types";

interface LeagueContactCardProps {
  contact: LeagueContact;
}

export function LeagueContactCard({ contact }: LeagueContactCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="mb-2">
        <p className="text-sm font-semibold text-gray-900">{contact.name}</p>
        <p className="text-xs text-gray-500">{contact.role}</p>
        {contact.team_name && (
          <p className="text-xs text-gray-400 mt-0.5">{contact.team_name}</p>
        )}
      </div>
      {contact.notes && (
        <p className="text-xs text-gray-500 italic mb-2 border-l-2 border-gray-200 pl-2">
          {contact.notes}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>📞</span>
            <span>{contact.phone}</span>
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 min-w-0"
          >
            <span>✉</span>
            <span className="truncate">{contact.email}</span>
          </a>
        )}
      </div>
    </div>
  );
}
