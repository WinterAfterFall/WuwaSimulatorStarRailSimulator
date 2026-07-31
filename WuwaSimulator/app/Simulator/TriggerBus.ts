import type { AllyUnit } from "../Models/AllyUnit";
import { ActionType, TriggerEvent } from "../Constants/Enum";

/**
 * amount คือค่าก่อน clamp กับ maxEnergy — listener เห็นค่านี้ได้ก่อนโดนตัด
 * เพื่อให้ passive แบบ "energy ล้นแปลงเป็นบัพอื่น" ทำงานได้ (ตรวจ unit.energy + amount > unit.maxEnergy เอง)
 */
export interface EnergyIncreaseContext {
    unit: AllyUnit;
    amount: number;
    actionType?: ActionType;
}

/** เพิ่ม event ใหม่ที่นี่ — key ต้องตรงกับ TriggerEvent enum ใน Constants/Enum.ts */
export interface TriggerEventMap {
    [TriggerEvent.EnergyIncrease]: EnergyIncreaseContext;
}

interface Listener<K extends TriggerEvent> {
    priority: number;
    callback: (ctx: TriggerEventMap[K]) => void;
}

/**
 * TriggerBus — รวม list ความสามารถของตัวละครที่ต้อง "ฟัง" event กลางของ battle
 * ตัวละครแต่ละตัว register callback ของตัวเองไว้ตอน setup แล้ว engine เป็นคน emit
 * ทุกครั้งที่ action จริงเกิด event นั้นขึ้น (ปรับจากแนวคิด trigger list ของ StarRailSimulator
 * — เทียบเท่า When_Energy_Increase_List + allEventWhenEnergyIncrease)
 */
export class TriggerBus {
    private listeners: { [K in TriggerEvent]?: Listener<K>[] } = {};

    /** ลงทะเบียน listener — priority มากไปน้อยออกก่อน, เท่ากันเรียงตามลำดับ register (stable sort) */
    public on<K extends TriggerEvent>(
        event: K,
        callback: (ctx: TriggerEventMap[K]) => void,
        priority: number = 0
    ): void {
        const list = (this.listeners[event] ??= []) as Listener<K>[];
        list.push({ priority, callback });
        list.sort((a, b) => b.priority - a.priority);
    }

    /** emit event — เรียก listener ทุกตัวที่ลงทะเบียนไว้ ตามลำดับ priority */
    public emit<K extends TriggerEvent>(event: K, ctx: TriggerEventMap[K]): void {
        (this.listeners[event] as Listener<K>[] | undefined)?.forEach(l => l.callback(ctx));
    }
}
