import fs from 'node:fs/promises';
import path from 'node:path';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const SAMPLE_DIR = path.resolve(process.cwd(), 'sample-docs');

const jobDescription = `Senior Software Engineer

About the Role
We are looking for a Senior Software Engineer to join our team. The ideal candidate has strong experience building scalable web applications with TypeScript, React, and Node.js.

Required Qualifications
- 5+ years of professional software engineering experience
- Strong proficiency in TypeScript and React
- Experience with Node.js and REST APIs
- Bachelor's degree in Computer Science or equivalent experience

Preferred Qualifications
- Experience with cloud platforms (AWS or Azure)
- Familiarity with Docker and Kubernetes
- Experience with PostgreSQL or similar relational databases
- Agile/Scrum experience

Responsibilities
- Design and implement features for our core platform
- Collaborate with product and design teams
- Mentor junior engineers
- Write clean, maintainable, and well-tested code`;

const resumeA = `Alice Johnson
Senior Software Engineer

Summary
Experienced full-stack engineer with 7 years building scalable web applications using TypeScript, React, and Node.js. Passionate about clean code and mentoring.

Experience
Senior Software Engineer, TechCorp (2020-present)
- Led migration of legacy frontend to React and TypeScript
- Built REST and GraphQL APIs using Node.js
- Mentored 3 junior engineers

Software Engineer, StartupX (2017-2020)
- Developed customer-facing features with React
- Implemented CI/CD pipelines with GitHub Actions

Skills
TypeScript, React, Node.js, PostgreSQL, Docker, AWS, Jest, GraphQL

Education
BS Computer Science, State University`;

const resumeB = `Bob Smith
Software Developer

Summary
Full-stack developer with 4 years of experience in web development, primarily using JavaScript and Python.

Experience
Software Developer, WebSolutions (2019-present)
- Built and maintained websites with JavaScript and Django
- Worked with MySQL databases

Junior Developer, CodeBase (2017-2019)
- Assisted in frontend development with Vue.js

Skills
JavaScript, Python, Vue.js, MySQL, HTML, CSS

Education
BS Computer Science, City College`;

async function createDocx(filePath: string, content: string): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: content.split('\n').map((line) => new Paragraph({
        children: [new TextRun(line)],
      })),
    }],
  });
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(filePath, buffer);
}

async function createPdf(filePath: string, content: string): Promise<void> {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lineHeight = fontSize * 1.3;
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    page.drawText(line, {
      x: 50,
      y: height - 50 - i * lineHeight,
      size: fontSize,
      font,
      maxWidth: width - 100,
    });
  });

  const bytes = await doc.save({ useObjectStreams: false });
  await fs.writeFile(filePath, bytes);
}

async function main() {
  await fs.mkdir(SAMPLE_DIR, { recursive: true });
  await createDocx(path.join(SAMPLE_DIR, 'sample-jd.docx'), jobDescription);
  await createPdf(path.join(SAMPLE_DIR, 'sample-resume-a.pdf'), resumeA);
  await createPdf(path.join(SAMPLE_DIR, 'sample-resume-b.pdf'), resumeB);
  console.log(`Created sample documents in ${SAMPLE_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
