import React, { useState, useEffect } from 'react';
import { Coffee, X, Copy, Check, Heart, ExternalLink, CreditCard, Edit2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface BuyCoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyCoffeeModal: React.FC<BuyCoffeeModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Bank account details with localStorage persistence
  const [bankName, setBankName] = useState<string>(() => {
    return localStorage.getItem('coffee_bank_name') || 'VP Bank';
  });
  const [beneficiaryBankName, setBeneficiaryBankName] = useState<string>(() => {
    return localStorage.getItem('coffee_beneficiary_bank_name') || 'Vietnam Prosperity Joint Stock Commercial Bank';
  });
  const [headOfficeAddress, setHeadOfficeAddress] = useState<string>(() => {
    return localStorage.getItem('coffee_head_office_address') || '89 Lang Ha Street, Dong Da District, Hanoi, Vietnam';
  });
  const [swiftCode, setSwiftCode] = useState<string>(() => {
    return localStorage.getItem('coffee_swift_code') || 'VPBKVNVX';
  });
  const [accountNumber, setAccountNumber] = useState<string>(() => {
    return localStorage.getItem('coffee_account_number') || '0948551966';
  });
  const [accountHolder, setAccountHolder] = useState<string>(() => {
    return localStorage.getItem('coffee_account_holder') || 'TRAN CHI TAM';
  });
  const [paypalEmail, setPaypalEmail] = useState<string>(() => {
    return localStorage.getItem('coffee_paypal_email') || 'tct551966@gmail.com';
  });

  const [isEditingBank, setIsEditingBank] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('coffee_bank_name', bankName);
    localStorage.setItem('coffee_beneficiary_bank_name', beneficiaryBankName);
    localStorage.setItem('coffee_head_office_address', headOfficeAddress);
    localStorage.setItem('coffee_swift_code', swiftCode);
    localStorage.setItem('coffee_account_number', accountNumber);
    localStorage.setItem('coffee_account_holder', accountHolder);
    localStorage.setItem('coffee_paypal_email', paypalEmail);
  }, [bankName, beneficiaryBankName, swiftCode, headOfficeAddress, accountNumber, accountHolder, paypalEmail]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Coffee className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>{t.buyCoffeeTitle}</span>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            </h3>
            <p className="text-xs text-slate-400">{t.buyCoffeeSubtitle}</p>
          </div>
        </div>

        {/* Content Body: PayPal & Bank Account */}
        <div className="mt-5 space-y-4 text-xs">
          {/* SECTION 1: PAYPAL */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                  P
                </div>
                <span className="font-semibold text-white text-sm">PayPal Support</span>
              </div>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded">
                International (USD)
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>PayPal Account Email:</span>
                <button
                  onClick={() => handleCopy(paypalEmail, 'paypal')}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-mono transition-colors cursor-pointer"
                >
                  {copiedKey === 'paypal' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy email</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 font-semibold flex items-center justify-between">
                <span>{paypalEmail}</span>
                <a
                  href={`https://paypal.me/${paypalEmail.split('@')[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-[11px] transition-colors cursor-pointer"
                >
                  <span>Open PayPal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* SECTION 2: SỐ TÀI KHOẢN NGÂN HÀNG (BANK ACCOUNT) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-white text-sm">Direct Bank Transfer</span>
              </div>
              <button
                onClick={() => setIsEditingBank(!isEditingBank)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Customize your bank account details"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingBank ? 'Done' : 'Edit'}</span>
              </button>
            </div>

            {isEditingBank ? (
              /* Inline form for editing bank info */
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Bank Name (Short):</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. MB Bank"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Beneficiary Bank Name (Full / International):</label>
                  <input
                    type="text"
                    value={beneficiaryBankName}
                    onChange={(e) => setBeneficiaryBankName(e.target.value)}
                    placeholder="e.g. Military Commercial Joint Stock Bank"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Head Office Address:</label>
                  <input
                    type="text"
                    value={headOfficeAddress}
                    onChange={(e) => setHeadOfficeAddress(e.target.value)}
                    placeholder="e.g. 89 Lang Ha Street, Dong Da District, Hanoi, Vietnam"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">SWIFT / BIC Code:</label>
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VPBKVNVX"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Account Number:</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 0988889999"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Account Holder Name:</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="e.g. TRAN CHI TAM"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  onClick={() => setIsEditingBank(false)}
                  className="w-full mt-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer transition-colors"
                >
                  Save Account Details
                </button>
              </div>
            ) : (
              /* Bank card display */
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-sans">Bank:</span>
                    <span className="font-bold text-white text-xs">{bankName}</span>
                  </div>

                  <div className="flex items-start justify-between py-1 border-t border-slate-800/70 gap-2">
                    <span className="text-[11px] text-slate-400 font-sans shrink-0">Beneficiary Bank Name:</span>
                    <div className="flex items-center gap-1.5 text-right">
                      <span className="font-medium text-slate-200 text-xs break-words">{beneficiaryBankName}</span>
                      <button
                        onClick={() => handleCopy(beneficiaryBankName, 'beneficiary-bank')}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                        title="Copy beneficiary bank name"
                      >
                        {copiedKey === 'beneficiary-bank' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between py-1 border-t border-slate-800/70 gap-2">
                    <span className="text-[11px] text-slate-400 font-sans shrink-0">Head Office Address:</span>
                    <div className="flex items-center gap-1.5 text-right">
                      <span className="font-medium text-slate-200 text-xs break-words">{headOfficeAddress}</span>
                      <button
                        onClick={() => handleCopy(headOfficeAddress, 'head-office-address')}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                        title="Copy head office address"
                      >
                        {copiedKey === 'head-office-address' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-slate-800/70">
                    <span className="text-[11px] text-slate-400 font-sans">SWIFT / BIC Code:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                        {swiftCode}
                      </span>
                      <button
                        onClick={() => handleCopy(swiftCode, 'swift')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md transition-colors cursor-pointer"
                        title="Copy SWIFT/BIC code"
                      >
                        {copiedKey === 'swift' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>


                  <div className="flex items-center justify-between py-1 border-t border-slate-800/70">
                    <span className="text-[11px] text-slate-400 font-sans">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-amber-400 tracking-wider tabular-nums">
                        {accountNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(accountNumber, 'bank')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md transition-colors cursor-pointer"
                        title="Copy account number"
                      >
                        {copiedKey === 'bank' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-slate-800/70">
                    <span className="text-[11px] text-slate-400 font-sans">Account Holder:</span>
                    <span className="font-semibold text-white tracking-wide uppercase text-xs">
                      {accountHolder}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-slate-800/70">
                    <span className="text-[11px] text-slate-400 font-sans">Transfer Note:</span>
                    <span className="font-mono text-amber-300 text-[11px]">Buy a coffee</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(accountNumber, 'bank-cta')}
                  className="w-full py-2.5 rounded-lg font-semibold text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedKey === 'bank-cta' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Account Number Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copy Account Number</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
