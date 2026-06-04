/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
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
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're now on Pro</Heading>
        <Text style={text}>Thanks for upgrading to {SITE_NAME} Pro.</Text>
        <Text style={text}>
          Your account is now unlocked: unlimited studies, unlimited responses, and full results
          export — yours forever.
        </Text>
        <Text style={text}>
          Your receipt has been emailed separately by our payment processor.
        </Text>
        <Text style={footer}>— {SITE_NAME}</Text>
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

const main = { backgroundColor: '#ffffff', fontFamily: "'Calibre', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#0f172a', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '14px', color: '#999999', margin: '30px 0 0' }
