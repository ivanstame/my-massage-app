// test/utils/LuxonService.test.js

import { DateTime } from 'luxon';
import LuxonService from '../../src/utils/LuxonService';
import { DEFAULT_TZ, TIME_FORMATS } from '../../src/utils/timeConstants';
import { DST_TEST_CASES, createTransitionTestCases, multiSessionEdgeCases } from './timeTestHelpers';

describe('LuxonService', () => {
  beforeAll(() => {
    LuxonService.init();
  });

  describe('convertToLA', () => {
    it('correctly converts UTC to LA time', () => {
      const utcDate = new Date('2024-01-01T08:00:00Z'); // 8 AM UTC
      const laDateTime = LuxonService.convertToLA(utcDate);
      expect(laDateTime.zoneName).toBe('America/Los_Angeles');
      expect(laDateTime.hour).toBe(0); // Should be midnight LA time
    });
  });

  describe('DST handling', () => {
    it('correctly handles spring forward', () => {
      const { springForward } = DST_TEST_CASES;
      const beforeDST = DateTime.fromFormat(
        `${springForward.date} ${springForward.before}`, 
        'yyyy-MM-dd HH:mm:ss',
        { zone: DEFAULT_TZ }
      );
      
      // 1:59 AM + 1 minute should jump to 3:00 AM
      const afterDST = beforeDST.plus({ minutes: 1 });
      expect(afterDST.hour).toBe(3);
      expect(afterDST.minute).toBe(0);
    });

    it('correctly handles fall back', () => {
      // Create two distinct times during the fallback:
      // One before and one after
      const beforeFallback = DateTime.fromISO('2023-11-05T01:30:00', { zone: DEFAULT_TZ });
      const afterFallback = DateTime.fromISO('2023-11-05T02:30:00', {
        zone: DEFAULT_TZ,
        setZone: true
      }).setZone(DEFAULT_TZ, { keepLocalTime: true, preferLate: true });
      
      // Verify we can parse both times correctly
      expect(beforeFallback.isValid).toBe(true);
      expect(afterFallback.isValid).toBe(true);
      
      // Verify they have the correct wall clock times
      expect(beforeFallback.toFormat('h:mm a')).toBe('1:30 AM');
      expect(afterFallback.toFormat('h:mm a')).toBe('2:30 AM');
      
      // Most importantly - verify they're in different UTC offsets
      const beforeOffset = beforeFallback.offset;
      const afterOffset = afterFallback.offset;
      console.log("Before fallback offset:", beforeOffset);
    console.log("After fallback offset:", afterOffset);
      expect(beforeOffset).not.toBe(afterOffset);
    });
  });

  describe('generateTimeSlots', () => {
    it('generates correct number of slots', () => {
      const start = '2024-01-01T09:00:00';
      const end = '2024-01-01T11:00:00';
      const slots = LuxonService.generateTimeSlots(start, end, 30);
      expect(slots).toHaveLength(4); // Should have 4 30-minute slots
    });

    it('handles slots across DST transition', () => {
      const { springForward } = DST_TEST_CASES;
      const slots = LuxonService.generateTimeSlots(
        `${springForward.date}T01:00:00`,
        `${springForward.date}T04:00:00`,
        30
      );
      
      // Should skip invalid times during spring forward
      const times = slots.map(slot => DateTime
        .fromISO(slot.start)
        .setZone(DEFAULT_TZ)
        .toFormat(TIME_FORMATS.TIME_24H)
      );
      
      expect(times).not.toContain('02:00');
      expect(times).not.toContain('02:30');
    });
  });

  describe('generateMultiSessionSlots', () => {
    it('validates work hours correctly', () => {
      const startTimeLA = DateTime.fromFormat('21:00', TIME_FORMATS.TIME_24H, { zone: DEFAULT_TZ });
      const result = LuxonService.generateMultiSessionSlots(
        startTimeLA,
        [240, 60], // 4 hours + 1 hour
        30,        // 30 min buffer
        6,         // 6 AM start
        22         // 10 PM end
      );
      
      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toContain('SLOT_INVALID_REASON_OUTSIDE_WORK_HOURS');
    });

    it('detects DST transitions', () => {
      const { springForward } = DST_TEST_CASES;
      const startTimeLA = DateTime.fromFormat(
        `${springForward.date} 01:30`, 
        'yyyy-MM-dd HH:mm',
        { zone: DEFAULT_TZ }
      );
      
      const result = LuxonService.generateMultiSessionSlots(
        startTimeLA,
        [120, 60], // 2 hours + 1 hour
        30,        // 30 min buffer
        6,         // 6 AM start
        22         // 10 PM end
      );
      
      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toContain('SLOT_INVALID_REASON_DST_TRANSITION');
    });
  });
});
