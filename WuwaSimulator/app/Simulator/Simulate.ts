import { BattleField } from "./BattleField";
import { TriggerBus } from "./TriggerBus";
import { RotationDirector } from "./RotationDirector";
import { increaseEnergy } from "../Services/Combat/EnergyService";
import type { Queue } from "../Utils/queue";
import type { RotationAction } from "../Models/Combat/RotationAction";
import type { AllyUnit } from "../Models/AllyUnit";
import type { EnemyUnit } from "../Models/EnemyUnit";
import type { ActionType } from "../Constants/Enum";

/**
 * Simulate — ตัวจัดการ "รอบการรัน" การต่อสู้
 *
 * `BattleField` คือสถานะระหว่างสู้ (ใครอยู่ในสนาม + อะไรเกิดเมื่อไหร่)
 * ส่วน `Simulate` คือคนประกอบและสั่งเริ่ม แล้วรายงานผล — คนละหน้าที่กัน
 *
 * ทำหน้าที่เหมือน "global ขนาดย่อม" คือเข้าถึงของทุกชิ้นได้จากที่เดียว แต่มีได้หลายตัวพร้อมกัน
 * และอายุจบเมื่อ instance ถูกทิ้ง จึงไม่มี state รั่วข้ามรอบเหมือน global จริง
 *
 * เงื่อนไขเดียวที่ต้องรักษาไว้: **ส่งต่อเป็น argument เท่านั้น ห้ามมีไฟล์ไหน import instance ร่วมกัน**
 */
export class Simulate {
    public readonly battleField: BattleField;

    constructor() {
        this.battleField = new BattleField();
    }

    /** รวม listener ของทุกตัวละคร — ทางลัดไปที่ของจริงใน battleField */
    public get triggerBus(): TriggerBus {
        return this.battleField.triggerBus;
    }

    /**
     * เพิ่มตัวละครเข้าสนาม — ตัวแรกที่เพิ่มจะกลายเป็น onFieldChar ให้เลย
     * เพราะ EndAction/ChangeToAuto resolve unit จาก onFieldChar ถ้าลืมตั้งไว้จะ setFree() ไม่โดนใคร
     * แล้วตัวละครค้าง Busy ตลอดไปแบบเงียบๆ
     */
    public addAlly(unit: AllyUnit): AllyUnit {
        unit.allyNum = this.battleField.allies.length;
        this.battleField.allies.push(unit);

        if (this.battleField.onFieldChar === null) {
            this.battleField.onFieldChar = unit;
        }

        return unit;
    }

    /** สร้างมอนเข้าสนาม — ส่งต่อให้ battleField ตรงๆ มีไว้ให้ไฟล์ซีนเรียกที่เดียวจบ */
    public spawnEnemy(name: string): EnemyUnit {
        return this.battleField.createEnemy(name);
    }

    /**
     * เพิ่ม energy ให้ตัวละคร — คนเรียกไม่ต้องถือ triggerBus ไว้เอง
     * บอดี้จริงยังอยู่ที่ `Services/Combat/EnergyService.ts` เมธอดนี้เป็นแค่ทางผ่าน
     */
    public increaseEnergy(unit: AllyUnit, amount: number, actionType?: ActionType): void {
        increaseEnergy(unit, amount, this.triggerBus, actionType);
    }

    /**
     * รันการต่อสู้จนจบ — reset stats ทุก unit ก่อนเสมอ เรียกซ้ำใน sim เดิมได้
     * คืนจำนวนรอบของ loopQueue ที่ทำครบจริง (frame สุดท้ายอ่านจาก `sim.battleField.currentFrame`)
     */
    public run(
        setupQueue: Queue<RotationAction>,
        loopQueue : Queue<RotationAction>,
        maxLoops  : number
    ): number {
        this.battleField.resetAllUnits();

        const director = new RotationDirector(this.battleField, setupQueue, loopQueue, maxLoops);
        director.run();

        return director.currentLoopCount;
    }

    /**
     * วนหา substat allocation ที่ให้ดาเมจสูงสุดให้ `unit` — ตัวประกอบวงจร sim ↔ reroll
     *
     * แต่ละรอบทำ 3 จังหวะตามลำดับนี้เท่านั้น สลับไม่ได้:
     * 1. `run()` — รันจริง (ข้างในเรียก `resetAllUnits()` ซึ่ง `applySubstats()` ให้เอง
     *    ดังนั้น substat ที่ `rerollSubstats()` เพิ่งเปลี่ยนจะถูกโหลดเข้า stats ให้อัตโนมัติ ไม่ต้องเรียกเอง)
     * 2. `updateMaxRecords()` — วัดผลรอบนี้ ถ้าชนะ record เดิมจะเซฟ `bestSubstats`/`bestLuckBudget` + ชูธง `rerollImproved`
     * 3. `rerollSubstats()` — เสนอก้าวถัดไป คืน `false` เมื่อค้นหาจบ
     *
     * ปิดท้ายด้วย `run()` อีกหนึ่งรอบเสมอ เพราะตอน `rerollSubstats()` คืน `false` มันคืนแค่
     * `substats` กลับเป็น `bestSubstats` — แต่ `stats`/`dmgRecord` ของ unit ยังค้างผลของ candidate
     * ตัวสุดท้ายที่แพ้อยู่ รันปิดท้ายเพื่อให้ทุกอย่างตรงกับ config ที่ชนะจริง
     *
     * `maxIterations` เป็นเบรกมือกันวนไม่รู้จบ (ปกติ `rerollSubstats()` จบเองเพราะ tier มีขอบบน/ล่าง)
     * คืนจำนวนรอบ simulate ที่ทำจริงในลูปหลัก (ไม่นับรอบปิดท้าย)
     */
    public optimizeSubstats(
        unit      : AllyUnit,
        setupQueue: Queue<RotationAction>,
        loopQueue : Queue<RotationAction>,
        maxLoops  : number,
        maxIterations: number = 1000,
    ): number {
        let iterations = 0;

        while (iterations < maxIterations) {
            this.run(setupQueue, loopQueue, maxLoops);
            iterations++;

            unit.updateMaxRecords(this.battleField.enemies);

            if (!unit.rerollSubstats()) break;
        }

        this.run(setupQueue, loopQueue, maxLoops);

        return iterations;
    }
}
