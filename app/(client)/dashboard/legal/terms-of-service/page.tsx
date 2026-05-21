// app/(dashboard)/dashboard/legal/terms-of-service/page.tsx
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  AlertCircle,
  UserCheck,
  CreditCard,
  Shield,
  Clock,
  FileText,
  Users,
  AlertTriangle,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  LastUpdated,
  LegalContainer,
  LegalSection,
} from "@/components/dashboard/legal/legal-content";

export default function TermsOfServicePage() {
  return (
    <LegalContainer title="Terms of Service" icon={<Scale className="h-6 w-6" />}>
      <LastUpdated date="January 1, 2024" />

      <LegalSection title="1. Acceptance of Terms" icon={<FileText className="h-4 w-4" />}>
        <p>
          By accessing or using our banking platform, you agree to be bound by these Terms of
          Service and our Privacy Policy. If you do not agree to these terms, please do not use our
          services.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility" icon={<UserCheck className="h-4 w-4" />}>
        <p>To use our services, you must:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Be at least 18 years of age</li>
          <li>Have legal capacity to enter into binding agreements</li>
          <li>Provide accurate and complete registration information</li>
          <li>Not be located in a restricted jurisdiction</li>
          <li>Not be on any sanctioned or restricted party lists</li>
        </ul>
      </LegalSection>

      <LegalSection
        title="3. Account Registration and Security"
        icon={<Shield className="h-4 w-4" />}>
        <p>
          You are responsible for maintaining the security of your account credentials. You agree
          to:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Keep your password and 2FA codes confidential</li>
          <li>Notify us immediately of any unauthorized access</li>
          <li>Log out of your account after each session</li>
          <li>Not share your account with others</li>
          <li>Use strong, unique passwords</li>
        </ul>
        <p className="mt-3 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          We are not responsible for losses resulting from unauthorized access to your account if
          you failed to protect your credentials.
        </p>
      </LegalSection>

      <LegalSection title="4. Services and Transactions" icon={<CreditCard className="h-4 w-4" />}>
        <p>Our platform provides the following services:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Domestic and international money transfers</li>
          <li>Bill payments and recurring payments</li>
          <li>Account management and statements</li>
          <li>Virtual and physical debit cards</li>
          <li>Savings goals and financial planning tools</li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2">Transaction Processing</h3>
        <p>
          Transactions are subject to processing times and may be delayed due to: fraud checks,
          verification requirements, technical issues, or bank holidays. We strive to process all
          transactions promptly but do not guarantee instant processing.
        </p>
      </LegalSection>

      <LegalSection title="5. Fees and Charges" icon={<CreditCard className="h-4 w-4" />}>
        <p>We may charge fees for certain services, including but not limited to:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>International transfer fees (1-3% of transaction amount)</li>
          <li>Expedited processing fees ($5-25 per transaction)</li>
          <li>ATM withdrawal fees for out-of-network machines</li>
          <li>Card replacement fees ($10 per card)</li>
          <li>Inactivity fees (after 12 months of no activity)</li>
        </ul>
        <p className="mt-3">
          All applicable fees will be disclosed before you complete a transaction. We reserve the
          right to modify fees with 30 days&apos; notice.
        </p>
      </LegalSection>

      <LegalSection title="6. Limits and Restrictions" icon={<AlertTriangle className="h-4 w-4" />}>
        <p>Your account is subject to the following limits:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Daily transaction limit: $10,000</li>
          <li>Monthly transaction limit: $50,000</li>
          <li>Maximum account balance: $250,000 (FDIC insured limit)</li>
          <li>International transfer limit: $5,000 per transaction</li>
        </ul>
        <p className="mt-3">
          Limits may be increased after verification or based on your account history. We may impose
          additional restrictions to prevent fraud or comply with regulations.
        </p>
      </LegalSection>

      <LegalSection title="7. Prohibited Activities" icon={<AlertCircle className="h-4 w-4" />}>
        <p>You may not use our services for:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Illegal activities or transactions prohibited by law</li>
          <li>Money laundering or terrorist financing</li>
          <li>Fraudulent schemes or deceptive practices</li>
          <li>Gambling or prohibited gaming activities</li>
          <li>Adult content or services</li>
          <li>Weapons, ammunition, or explosive purchases</li>
          <li>Cryptocurrency investments or trading</li>
          <li>Pyramid schemes or multi-level marketing</li>
        </ul>
        <p className="mt-3">
          Violations will result in immediate account suspension and may be reported to authorities.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual Property" icon={<Scale className="h-4 w-4" />}>
        <p>
          All content, trademarks, logos, and intellectual property on our platform are owned by us
          or our licensors. You may not:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Copy, modify, or distribute our content without permission</li>
          <li>Reverse engineer our software or systems</li>
          <li>Use our trademarks without written consent</li>
          <li>Scrape or crawl our website for data</li>
        </ul>
      </LegalSection>

      <LegalSection
        title="9. Account Suspension and Termination"
        icon={<Clock className="h-4 w-4" />}>
        <p>We may suspend or terminate your account for:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Violation of these Terms of Service</li>
          <li>Suspected fraudulent or illegal activity</li>
          <li>Chargebacks or disputed transactions</li>
          <li>Extended period of inactivity (over 2 years)</li>
          <li>Upon your written request</li>
        </ul>
        <p className="mt-3">
          Upon termination, we will provide access to your remaining funds and transaction history,
          subject to legal holds or pending investigations.
        </p>
      </LegalSection>

      <LegalSection title="10. Liability Limitations" icon={<AlertTriangle className="h-4 w-4" />}>
        <p>To the maximum extent permitted by law, we are not liable for:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Indirect, incidental, or consequential damages</li>
          <li>Loss of profits, data, or business opportunities</li>
          <li>Unauthorized access to your account due to your negligence</li>
          <li>Third-party services or integrations</li>
          <li>System downtime or service interruptions</li>
        </ul>
        <p className="mt-3">
          Our total liability is limited to the amount of fees paid by you in the 12 months
          preceding the claim.
        </p>
      </LegalSection>

      <LegalSection title="11. Dispute Resolution" icon={<Scale className="h-4 w-4" />}>
        <p>
          Any disputes arising from these terms shall be resolved through binding arbitration in
          accordance with the rules of the American Arbitration Association.
        </p>
        <h3 className="font-semibold mt-3 mb-2">Class Action Waiver</h3>
        <p>
          You agree to resolve disputes on an individual basis and waive the right to participate in
          class actions or representative proceedings.
        </p>
        <h3 className="font-semibold mt-3 mb-2">Governing Law</h3>
        <p>
          These terms are governed by the laws of the State of New York, without regard to conflict
          of law principles.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to Terms" icon={<FileText className="h-4 w-4" />}>
        <p>
          We may update these terms periodically. Material changes will be communicated through:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Email notification to your registered address</li>
          <li>In-app notification upon login</li>
          <li>Updated posting on this page</li>
        </ul>
        <p className="mt-3">
          Continued use after changes constitutes acceptance. If you disagree, you may close your
          account.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact Information" icon={<Users className="h-4 w-4" />}>
        <p>For questions about these terms, please contact:</p>
        <ul className="list-none space-y-1 mt-2">
          <li>
            • Email: <strong>{process.env.NEXT_PUBLIC_LEGAL_EMAIL}</strong>
          </li>
          <li>
            • Phone: <strong>{process.env.NEXT_PUBLIC_LEGAL_PHONE}</strong>
          </li>
          <li>• Mail: {process.env.NEXT_PUBLIC_LEGAL_ADDRESS}</li>
        </ul>
      </LegalSection>

      <div className="mt-8 pt-6 border-t text-center">
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </LegalContainer>
  );
}
