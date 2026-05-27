// hello.ts
const greeter = (name: string): string => {
  return `Hello, ${name}! This is running from a TypeScript executable.`;
};

const userName: string = "User";
console.log(greeter(userName));

// เพิ่มบรรทัดนี้เพื่อให้โปรแกรมไม่ปิดตัวทันทีเมื่อรันบน Windows (รอให้เรากด Enter ก่อน)
console.log("\nPress Enter to exit...");
process.stdin.once('data', () => {
    process.exit();
});
