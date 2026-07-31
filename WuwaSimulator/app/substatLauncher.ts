import { SUBSTAT_TABLES, SubstatTableKey } from "./extra/substats/SubstatData";
import { buildProbabilityTable, buildTuneDecisionMatrix, compareTuneTarget } from "./extra/substats/SubstatProbability";

function printTable(tableKey: SubstatTableKey) {
    const { label } = SUBSTAT_TABLES[tableKey];
    console.log(`\n--- ${label} ---`);
    console.log("tier | exact%   | at least%  | tune-up%");
    for (const row of buildProbabilityTable(tableKey)) {
        console.log(
            `${row.tier}    | ${row.exact.toFixed(4).padStart(8)} | ${row.survive.toFixed(4).padStart(10)} | ${row.tuneUp.toFixed(4).padStart(8)}`
        );
    }
}

function printDecisionMatrix(tableAKey: SubstatTableKey, tableBKey: SubstatTableKey = tableAKey) {
    const matrix = buildTuneDecisionMatrix(tableAKey, tableBKey);
    const labelA = SUBSTAT_TABLES[tableAKey].label;
    const labelB = SUBSTAT_TABLES[tableBKey].label;

    console.log(`\n--- Decision matrix: a = ${labelA} (row) / b = ${labelB} (col) — 1 = เพิ่ม a, 0 = เพิ่ม b ---`);
    const header = "a\\b | " + matrix[0].map((_, b) => String(b + 1).padStart(2)).join(" ");
    console.log(header);
    matrix.forEach((row, i) => {
        console.log(`${String(i + 1).padStart(3)} | ` + row.map((v) => String(v).padStart(2)).join(" "));
    });
}

function runSubstatProbabilityDemo() {
    console.log("=== ตาราง exact / at-least / tune-up ทั้ง 4 กลุ่ม ===");
    (Object.keys(SUBSTAT_TABLES) as SubstatTableKey[]).forEach(printTable);

    // ตัวอย่าง: a>=b ในตารางเดียวกัน (main) — ATK% tier 6 vs DEF% tier 3
    console.log("\n=== ตัวอย่าง: เทียบ tune ระหว่าง tier a (สูงกว่า) กับ tier b (ต่ำกว่า) — ตารางเดียวกัน ===");
    const sameTable = compareTuneTarget({ tableKey: "main", tier: 6 }, { tableKey: "main", tier: 3 });
    console.log(`a (tier 6): tune-up chance = ${sameTable.a.chance.toFixed(4)}%`);
    console.log(`b (tier 3): tune-up chance = ${sameTable.b.chance.toFixed(4)}%`);
    console.log(`แนะนำ: tune ตัว "${sameTable.recommend}"`);
    console.log("เหตุผล: ในตารางเดียวกัน survival(tier+1) ไม่มีวันเพิ่มขึ้นเมื่อ tier สูงขึ้น ดังนั้นถ้า a>=b ตัว b จะมีโอกาส tune ขึ้นสูงกว่าหรือเท่ากับ a เสมอ");

    // ตัวอย่าง: ข้ามตาราง — Crit Rate tier 5 vs ATK flat tier 2
    console.log("\n=== ตัวอย่าง: เทียบ tune ข้ามตาราง (Crit Rate tier 5 vs ATK flat tier 2) ===");
    const crossTable = compareTuneTarget({ tableKey: "crit", tier: 5 }, { tableKey: "flatAtk", tier: 2 });
    console.log(`Crit Rate (tier 5): tune-up chance = ${crossTable.a.chance.toFixed(4)}%`);
    console.log(`ATK flat (tier 2): tune-up chance = ${crossTable.b.chance.toFixed(4)}%`);
    console.log(`แนะนำ: tune ตัว "${crossTable.recommend}"`);
    console.log("หมายเหตุ: การเปรียบเทียบนี้ดูแค่ \"โอกาสสำเร็จ\" ยังไม่ได้ถ่วงด้วย value function ต่อตัวละคร (ดู README: ยังไม่มี value function) — ถ้า b ให้ค่าดาเมจต่อ tier น้อยกว่า a มาก อาจยัง tune a คุ้มกว่าแม้โอกาสต่ำกว่า");

    // ตาราง decision matrix เต็ม — เผื่ออยาก lookup ตรงๆ โดยไม่ต้องเรียกฟังก์ชัน
    printDecisionMatrix("main");
    printDecisionMatrix("crit");
    printDecisionMatrix("flatAtk");
    printDecisionMatrix("flatDef");
}

runSubstatProbabilityDemo();
