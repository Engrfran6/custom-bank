// app/(dashboard)/dashboard/legal/privacy-policy/page.tsx
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Database,
  Cookie,
  Shield,
  Lock,
  Mail,
  Trash2,
  Globe,
  AlertCircle,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  LastUpdated,
  LegalContainer,
  LegalSection,
} from "@/components/dashboard/legal/legal-content";

export default function PrivacyPolicyPage() {
  return (
    <LegalContainer title="Privacy Policy" icon={<Shield className="h-6 w-6" />}>
      <LastUpdated date="January 1, 2024" />

      <LegalSection title="1. Information We Collect" icon={<Database className="h-4 w-4" />}>
        <p>
          We collect information you provide directly to us, such as when you create an account,
          make a transaction, or contact us for support. This may include:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Personal identification information (name, email, phone number, date of birth)</li>
          <li>
            Financial information (bank account details, transaction history, card information)
          </li>
          <li>Government-issued ID for verification purposes</li>
          <li>Communication preferences and feedback</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information" icon={<Eye className="h-4 w-4" />}>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Process and complete financial transactions</li>
          <li>Verify your identity and prevent fraud</li>
          <li>Communicate with you about your account and transactions</li>
          <li>Improve our services and develop new features</li>
          <li>Comply with legal and regulatory requirements</li>
          <li>Send you important updates and security alerts</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Information Sharing" icon={<Globe className="h-4 w-4" />}>
        <p>
          We do not sell your personal information. We may share your information in the following
          circumstances:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>With third-party service providers who assist in processing transactions</li>
          <li>To comply with legal obligations or respond to lawful requests</li>
          <li>To protect our rights, property, or safety, and that of our users</li>
          <li>With your explicit consent or at your direction</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Data Security" icon={<Lock className="h-4 w-4" />}>
        <p>
          We implement industry-standard security measures to protect your information, including:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>256-bit SSL encryption for all data transmission</li>
          <li>Multi-factor authentication for account access</li>
          <li>Regular security audits and penetration testing</li>
          <li>Secure data centers with 24/7 monitoring</li>
          <li>Employee background checks and security training</li>
        </ul>
        <p className="mt-3">
          While we take reasonable measures to protect your information, no security system is
          impenetrable. We cannot guarantee the absolute security of your data.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies and Tracking" icon={<Cookie className="h-4 w-4" />}>
        <p>
          We use cookies and similar tracking technologies to enhance your experience on our
          platform. These technologies help us:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Remember your preferences and login information</li>
          <li>Analyze usage patterns to improve our services</li>
          <li>Detect and prevent fraudulent activity</li>
          <li>Provide personalized content and recommendations</li>
        </ul>
        <p className="mt-3">
          You can control cookie settings through your browser preferences. However, disabling
          cookies may affect the functionality of our services.
        </p>
      </LegalSection>

      <LegalSection title="6. Your Rights and Choices" icon={<Mail className="h-4 w-4" />}>
        <p>Depending on your location, you may have the following rights:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Access and receive a copy of your personal data</li>
          <li>Correct inaccurate or incomplete information</li>
          <li>Request deletion of your personal data</li>
          <li>Opt-out of marketing communications</li>
          <li>Restrict or object to certain data processing</li>
          <li>Data portability to another service</li>
        </ul>
        <p className="mt-3">
          To exercise these rights, contact us at{" "}
          <strong>{process.env.NEXT_PUBLIC_PRIVACY_EMAIL}</strong>.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Retention" icon={<Trash2 className="h-4 w-4" />}>
        <p>We retain your personal information for as long as necessary to:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Provide our services and maintain your account</li>
          <li>Comply with legal and regulatory requirements (typically 5-7 years)</li>
          <li>Resolve disputes and enforce our agreements</li>
          <li>Detect and prevent fraud</li>
        </ul>
        <p className="mt-3">
          After the retention period, your information will be securely deleted or anonymized.
        </p>
      </LegalSection>

      <LegalSection title="8. Children's Privacy" icon={<AlertCircle className="h-4 w-4" />}>
        <p>
          Our services are not directed to individuals under 18. We do not knowingly collect
          personal information from children. If you believe a child has provided us with personal
          information, please contact us immediately.
        </p>
      </LegalSection>

      <LegalSection title="9. International Data Transfers" icon={<Globe className="h-4 w-4" />}>
        <p>
          Your information may be transferred to and processed in countries other than your own. We
          ensure appropriate safeguards are in place to protect your information in accordance with
          applicable laws.
        </p>
      </LegalSection>

      <LegalSection title="10. Updates to This Policy" icon={<Eye className="h-4 w-4" />}>
        <p>
          We may update this privacy policy from time to time. We will notify you of any material
          changes by:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Posting the updated policy on this page</li>
          <li>Sending you an email notification</li>
          <li>Displaying a prominent notice in your dashboard</li>
        </ul>
        <p className="mt-3">
          Your continued use of our services after the effective date constitutes acceptance of the
          updated policy.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact Us" icon={<Mail className="h-4 w-4" />}>
        <p>If you have questions about this privacy policy, please contact us:</p>
        <ul className="list-none space-y-1 mt-2">
          <li>
            • Email: <strong>{process.env.NEXT_PUBLIC_PRIVACY_EMAIL}</strong>
          </li>
          <li>
            • Phone: <strong>{process.env.NEXT_PUBLIC_PRIVACY_PHONE}</strong>
          </li>
          <li>• Address: {process.env.NEXT_PUBLIC_PRIVACY_ADDRESS}</li>
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
