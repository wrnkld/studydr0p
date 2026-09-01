/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'StudyDrop'

const ProUnlockEmail = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're now on {SITE_NAME} Pro — thanks!</Preview>
    <Body>
      <Container style={container}>
        <Text style={title}>You're now on Pro</Text>
        <Text style={text}>Thanks for upgrading to {SITE_NAME} Pro.</Text>
        <Text style={text}>
          Your account is now unlocked: unlimited studies, unlimited responses, and full results
          export — yours forever.
        </Text>
        <Text style={lastText}>
          Your receipt has been emailed separately by our payment processor.
        </Text>
        <Text style={signoff}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ProUnlockEmail,
  subject: `You're now on ${SITE_NAME} Pro`,
  displayName: 'Pro Unlock Confirmation',
  previewData: {},
} satisfies TemplateEntry

const container = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  maxWidth: '600px',
  margin: '0 auto',
  padding: '40px 20px',
  fontSize: '16px',
}
const title = { fontWeight: 600 as const, margin: '0 0 24px' }
const text = { lineHeight: '1.6', color: '#374151', margin: '0 0 16px' }
const lastText = { lineHeight: '1.6', color: '#374151', margin: '0 0 24px' }
const signoff = { color: '#6b7280', margin: '0' }
