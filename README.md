<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EduStream - AI-Powered Educational Platform

An intelligent educational platform for teachers to manage courses, generate AI-powered quizzes, review student work with OCR, and track performance analytics.

## 🌟 Features

- **AI-Assisted Quiz Generation** - Automatically create quizzes from uploaded materials
- **OCR Student Work Review** - Quick review of handwritten assignments
- **Course Management** - Organize and manage multiple courses
- **Performance Analytics** - Track student progress and identify areas for improvement
- **Material Upload** - Support for various file formats (PDF, images, etc.)
- **Multi-language Support** - Russian and English interfaces

## 🚀 Quick Start

**Prerequisites:** Node.js (v14+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:5173`

## 🧪 Teacher Usage Testing

We've created comprehensive testing scripts to validate the platform's functionality for teachers. 

### Run Demo Tests (No Backend Required):
```bash
node teacher-usage-test-demo.cjs
```

### Run Full Tests (Requires Backend):
```bash
node teacher-usage-test.cjs
```

### Test Results:
- ✅ **87.5% Success Rate** (7/8 tests passed)
- 📊 **Average Usability: 8.4/10**
- ✅ **Platform Ready for Teachers**

For detailed information, see:
- [Testing Guide](./TEACHER_TESTING.md)
- [Test Report](./TEACHER_TEST_REPORT.md)
- [Testing Summary](./TESTING_SUMMARY.md)

## 📚 Documentation

- [Technical Documentation](./TECHNICAL_docs.md)
- [Architecture Guide](./architecture_guide.md)
- [API Specification](./swagger.yml)
- [Teacher Testing](./TEACHER_TESTING.md)

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Custom components with Tailwind CSS
- **State Management**: React Context API
- **API Integration**: RESTful API with JWT authentication
- **AI Integration**: OpenRouter AI for quiz generation and analysis

## 🎓 For Teachers

### Getting Started:
1. Register an account
2. Create your first course
3. Upload course materials
4. Generate AI-powered quizzes
5. Review student submissions with OCR
6. Track progress in analytics

### Best Practices:
- Keep materials organized by topic
- Use AI generation as a starting point, then refine
- Regularly review analytics to identify struggling students
- Provide timely feedback on student work

## 🔧 Development

### Build for Production:
```bash
npm run build
```

### Preview Production Build:
```bash
npm run preview
```

## 📊 Platform Status

| Feature | Status | Performance |
|---------|--------|-------------|
| Authentication | ✅ Working | < 300ms |
| Course Management | ✅ Working | < 400ms |
| Material Upload | ✅ Working | < 600ms |
| AI Quiz Generation | ⚠️ Working (Slow) | ~5s |
| OCR Review | ✅ Working | < 500ms |
| Dashboard | ✅ Working | < 800ms |
| Analytics | ✅ Working | < 700ms |
| Settings | ✅ Working | < 400ms |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License

## 🔗 Links

- **Repository**: https://github.com/baltabekpro/-EduStream
- **Issues**: https://github.com/baltabekpro/-EduStream/issues
- **AI Studio**: https://ai.studio/apps/drive/10vHVQe6clyWfownGYao0eS2K7HW2E3AR
