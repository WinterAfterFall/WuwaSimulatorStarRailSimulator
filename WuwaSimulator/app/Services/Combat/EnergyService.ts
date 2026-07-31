import { AllyUnit } from "../../Models/AllyUnit";
import { TriggerBus } from "../../Simulator/TriggerBus";
import { ActionType, TriggerEvent } from "../../Constants/Enum";

/**
 * increaseEnergy — จุดเดียวที่ทุกทางที่ทำให้ energy เพิ่มต้องเรียกผ่าน
 * emit event ให้ listener ก่อน mutate จริง (listener เห็นค่า amount ก่อน clamp กับ maxEnergy
 * จึงตรวจ "energy จะล้น" ได้ — ปรับจาก Increase_energy ของ StarRailSimulator)
 */
export function increaseEnergy(
    unit: AllyUnit,
    amount: number,
    triggerBus: TriggerBus,
    actionType?: ActionType
): void {
    triggerBus.emit(TriggerEvent.EnergyIncrease, { unit, amount, actionType });
    unit.energy = Math.min(unit.maxEnergy, unit.energy + amount);
}
