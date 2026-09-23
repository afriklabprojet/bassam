import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
const from = process.env.RESEND_FROM_EMAIL?.trim() ?? '';
const supportTo = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ?? '';

function extractEmail(value: string) {
  const bracketed = value.match(/<([^>]+)>/u)?.[1];
  return (bracketed ?? value).trim().toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

function printCheck(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? 'OK' : 'ERREUR'}  ${label}: ${detail}`);
}

async function main() {
  const requestVerification = process.argv.includes('--verify');
  const senderEmail = extractEmail(from);
  const senderDomain = senderEmail.split('@')[1] ?? '';
  const localChecks = [
    { label: 'RESEND_API_KEY', ok: apiKey.startsWith('re_') && apiKey.length > 10, detail: apiKey ? 'présente' : 'absente' },
    { label: 'RESEND_FROM_EMAIL', ok: isEmail(senderEmail), detail: from || 'absente' },
    { label: 'NEXT_PUBLIC_SUPPORT_EMAIL', ok: isEmail(supportTo), detail: supportTo || 'absente' },
  ];

  for (const check of localChecks) printCheck(check.label, check.ok, check.detail);

  if (localChecks.some((check) => !check.ok)) {
    process.exitCode = 1;
    return;
  }

  const response = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    printCheck('Clé Resend', false, `API HTTP ${response.status}`);
    process.exitCode = 1;
    return;
  }

  const payload = await response.json() as {
    data?: Array<{ id?: string; name?: string; status?: string }>;
  };
  const domain = payload.data?.find((item) => item.name === senderDomain);
  let verified = domain?.status === 'verified';
  printCheck('Domaine expéditeur', verified, domain ? `${senderDomain} (${domain.status})` : `${senderDomain} introuvable dans Resend`);

  if (!verified) {
    if (domain?.id) {
      if (requestVerification) {
        const verifyResponse = await fetch(`https://api.resend.com/domains/${domain.id}/verify`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        printCheck('Demande de vérification', verifyResponse.ok, `API HTTP ${verifyResponse.status}`);
      }

      const detailResponse = await fetch(`https://api.resend.com/domains/${domain.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (detailResponse.ok) {
        const detail = await detailResponse.json() as {
          status?: string;
          records?: Array<{
            record?: string;
            name?: string;
            type?: string;
            value?: string;
            priority?: number;
            status?: string;
          }>;
        };
        verified = detail.status === 'verified';
        if (verified) {
          printCheck('Domaine expéditeur', true, `${senderDomain} (verified)`);
        }
        for (const record of detail.records ?? []) {
          const priority = record.priority ? ` priorité=${record.priority}` : '';
          console.log(`DNS  ${record.record ?? 'Resend'} ${record.type ?? ''} ${record.name ?? ''} -> ${record.value ?? ''}${priority} (${record.status ?? 'inconnu'})`);
        }
      }
    }
    if (verified) {
      console.log('OK  Configuration mail prête pour les envois de production.');
      return;
    }
    process.exitCode = 1;
    return;
  }

  console.log('OK  Configuration mail prête pour les envois de production.');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'erreur inconnue';
  console.error(`ERREUR  Vérification Resend impossible: ${message}`);
  process.exitCode = 1;
});