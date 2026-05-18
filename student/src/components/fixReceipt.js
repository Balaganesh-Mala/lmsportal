const fs = require('fs');
const path = 'e:\\Projects_IT\\LMS_Project1\\student\\src\\components\\ReceiptModal.jsx';
let content = fs.readFileSync(path, 'utf8');

// Update feeSummary logic in useEffect
content = content.replace(
    /const totalPaidAtTime = allInst\s+\.filter\(i => \(i\.status === 'Paid' \|\| i\._id === installment\._id\) && i\.installment_no <= installment\.installment_no\)\s+\.reduce\(\(sum, i\) => sum \+ i\.amount, 0\);\s+const totalFee = allInst\.reduce\(\(sum, i\) => sum \+ i\.amount, 0\);\s+const previousPaid = totalPaidAtTime - installment\.amount;\s+setFeeSummary\({ total: totalFee, pending: totalFee - totalPaidAtTime, previousPaid }\);/,
    `const allInst = installmentsRes.data;
                const isSubscription = installment.installment_no === 99;
                const courseInstallments = allInst.filter(i => i.installment_no !== 99);
                const totalPaidAtTime = courseInstallments.filter(i => (i.status === 'Paid' || i._id === installment._id) && i.installment_no <= installment.installment_no).reduce((sum, i) => sum + i.amount, 0);
                const totalFee = courseInstallments.reduce((sum, i) => sum + i.amount, 0);
                const previousPaid = isSubscription ? 0 : totalPaidAtTime - installment.amount;
                setFeeSummary({ total: totalFee, pending: totalFee - (isSubscription ? 0 : totalPaidAtTime), previousPaid, isSubscription });`
);

// Update UI
content = content.replace(
    /\{\/\* Fee Summary Stats \*\/\}\s+<div className="flex justify-between text-\[11px\] pt-3 border-t-2 border-slate-100">/,
    `{/* Fee Summary Stats */}
                                             {!feeSummary.isSubscription ? (
                                                <>
                                                    <div className="flex justify-between text-[11px] pt-3 border-t-2 border-slate-100">`
);

// This is getting complex for a script. I'll just use a more robust way to edit.
// Wait, I'll just use the multi_replace_file_content tool but with LESS whitespace in the target.

fs.writeFileSync(path, content);
console.log('File updated');
