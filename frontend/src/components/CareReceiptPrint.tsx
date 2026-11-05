import React, { useRef } from 'react';

interface Props {
  careReceiptRef: string;
  destinationFacility: string;
  visitInstruction: string;
  dateIssued: string;
  helpContact?: string;
}

export default function CareReceiptPrint({
  careReceiptRef,
  destinationFacility,
  visitInstruction,
  dateIssued,
  helpContact = 'District helpline: 1800-XXX-XXXX',
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <button
        onClick={handlePrint}
        className="mb-3 px-3 py-1.5 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
      >
        Print Care Receipt
      </button>

      <div ref={printRef} className="print-area border border-gray-300 rounded p-6 max-w-md bg-white">
        <h2 className="text-center text-lg font-bold text-navy-900 mb-1">POSHANLOOP</h2>
        <p className="text-center text-xs text-navy-500 mb-4">Care Receipt — Referral Slip</p>

        <div className="text-center border-2 border-navy-900 rounded px-4 py-3 mb-4">
          <p className="text-xs text-navy-500 uppercase tracking-wide">Reference Code</p>
          <p className="text-2xl font-bold tracking-wider text-navy-900">{careReceiptRef}</p>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold text-navy-700">Destination:</span>{' '}
            <span>{destinationFacility}</span>
          </div>
          <div>
            <span className="font-semibold text-navy-700">Instructions:</span>{' '}
            <span>{visitInstruction}</span>
          </div>
          <div>
            <span className="font-semibold text-navy-700">Date issued:</span>{' '}
            <span>{new Date(dateIssued).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-navy-500">
          <p>{helpContact}</p>
          <p className="mt-1">
            Present this slip at the facility. No personal health information is printed here.
          </p>
        </div>
      </div>
    </div>
  );
}
