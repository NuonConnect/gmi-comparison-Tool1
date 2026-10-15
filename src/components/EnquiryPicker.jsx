import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchEnquiries } from '../utils/zoho';

// Links the comparison to a Zoho CRM enquiry. The company name drives the
// search as it's typed, so the matching enquiries are waiting by the time the
// advisor looks; typing in the box searches by any name or enquiry number
// instead.
//
// The advisor always picks the enquiry — nothing is chosen automatically. One
// company often has several enquiries, and linking a comparison to the wrong
// one attaches it to another client's record.

const Badge = ({ className, children }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap ${className}`}>
    {children}
  </span>
);

export default function EnquiryPicker({ companyName, enquiry, onSelect }) {
  const { getAccessToken } = useAuth();
  const company = String(companyName || '');
  const [query, setQuery] = useState('');
  // Once the advisor types in the box, stop overwriting it from the company name.
  const [typed, setTyped] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Responses can arrive out of order; only the latest search may update the list.
  const latest = useRef(0);

  // An emptied box falls back to the company name rather than searching
  // nothing, so clearing it never leaves the advisor with no list and no reason.
  const effectiveQuery = (typed && query.trim()) || company;

  useEffect(() => {
    if (enquiry) return undefined;
    const q = effectiveQuery.trim();
    if (q.length < 3) {
      latest.current += 1; // drop any search still in flight
      setResults([]);
      setError('');
      setLoading(false);
      return undefined;
    }
    const id = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchEnquiries(q, await getAccessToken());
      if (id !== latest.current) return;
      setResults(res.enquiries);
      setError(res.error || '');
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [effectiveQuery, enquiry, getAccessToken]);

  if (enquiry) {
    return (
      <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-lg border-2 border-indigo-200 bg-white">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-sm text-indigo-700">{enquiry.enquiryNo}</span>
            <span className="text-sm font-semibold text-gray-800 truncate">
              {enquiry.enquiryName || enquiry.contactName}
            </span>
            {!enquiry.hasFolder && <Badge className="bg-amber-700">No WorkDrive folder</Badge>}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {[enquiry.contactName, enquiry.insuranceType, enquiry.subType].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {enquiry.folderUrl && (
            <a
              href={enquiry.folderUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-bold rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              📁 WorkDrive
            </a>
          )}
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="px-3 py-1.5 text-xs font-bold rounded border-2 border-gray-300 text-gray-600 bg-white hover:bg-gray-100 transition"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={typed ? query : company}
        onChange={(e) => {
          setTyped(true);
          setQuery(e.target.value);
        }}
        className="w-full p-2 border-2 border-indigo-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
        placeholder="🔍 Search by company name or enquiry number (e.g. Enq298581)"
      />
      <div className="text-[11px] text-gray-500 mt-1">
        {loading
          ? 'Searching Zoho…'
          : error
            ? <span className="text-red-700">{error}</span>
            : effectiveQuery.trim().length < 3
              ? 'Enter the company name, or type here, to find the enquiry.'
              : results.length
                ? `${results.length} enquir${results.length === 1 ? 'y' : 'ies'} found — pick the right one.`
                : 'No matching enquiries in Zoho.'}
        {typed && (
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => {
              setTyped(false);
              setQuery('');
            }}
          >
            use company name
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-2 max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {results.map((e) => (
            <button
              type="button"
              key={e.id}
              onClick={() => onSelect(e)}
              className="w-full text-left p-2.5 rounded border-2 border-gray-200 bg-white hover:border-indigo-400 transition"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-indigo-700">{e.enquiryNo}</span>
                <span className="text-sm font-semibold text-gray-800">{e.enquiryName || e.contactName}</span>
                {e.insuranceType === 'Group Medical' && <Badge className="bg-blue-600">Group Medical</Badge>}
                {!e.hasFolder && <Badge className="bg-amber-700">No WorkDrive folder</Badge>}
              </div>
              <div className="text-xs text-gray-500">
                {[e.contactName, e.insuranceType, e.subType, e.stage, e.enquiryDate].filter(Boolean).join(' · ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
