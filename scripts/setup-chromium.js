const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 운영체제 감지
const isWindows = process.platform === 'win32';
const isVercel = process.env.VERCEL === '1';

async function main() {
  console.log('Setting up Chromium...');
  
  try {
    // Chromium 설치 디렉토리 설정
    const chromiumDir = isWindows 
      ? path.join(process.cwd(), '.chromium')
      : '/tmp/chromium';
    
    // 디렉토리가 존재하지 않으면 생성
    if (!fs.existsSync(chromiumDir)) {
      console.log(`Creating directory: ${chromiumDir}`);
      fs.mkdirSync(chromiumDir, { recursive: true });
    }
    
    // 환경 변수 설정
    process.env.CHROMIUM_PATH = chromiumDir;
    
    // Chromium 실행 경로 확인
    console.log('Getting Chromium executable path...');
    
    // 브라우저 바이너리 경로 가져오기
    const execPath = await chromium.executablePath();
    console.log(`Chromium executable path: ${execPath}`);
    
    // 실행 파일이 이미 존재하는지 확인
    if (fs.existsSync(execPath)) {
      console.log('✅ Chromium is already installed!');
    } else {
      console.log('⚠️ Chromium executable not found. Will be downloaded on first use.');
      
      // 환경 정보 저장
      const envInfo = {
        platform: process.platform,
        arch: process.arch,
        node: process.version,
        chromiumPath: execPath
      };
      
      fs.writeFileSync(
        path.join(chromiumDir, 'env-info.json'), 
        JSON.stringify(envInfo, null, 2)
      );
    }
    
    console.log('Chromium setup completed.');
  } catch (error) {
    console.error('Error setting up Chromium:', error);
    process.exit(1);
  }
}

main(); 