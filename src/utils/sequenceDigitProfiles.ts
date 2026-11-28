/**
 * Cấu hình tập trung cho "Độ dài chữ số" (SequenceDigitProfile) dùng chung trên toàn bộ
 * các trang Thử Thách Cấp Độ Khó (Tab Tính Nhẩm / Mental Math).
 *
 * Khi muốn tự bổ sung độ dài chữ số mới (ví dụ: '4D5D', '5D', '5D6D', '2D3D4D'...):
 * - Chỉ cần thêm mã mới vào mảng `SEQUENCE_DIGIT_PROFILES` bên dưới (ví dụ thêm `'4D5D'`).
 * - Toàn bộ danh sách tùy chọn (<select>), nhãn hiển thị VI/EN, gợi ý đáp án, và thuật toán
 *   sinh câu hỏi (+, -, ×, ÷, lũy thừa, căn bậc hai, %) trên tất cả các Page thử thách
 *   sẽ tự động phân tích và chạy đúng theo khai báo mới nhất.
 */
export const SEQUENCE_DIGIT_PROFILES = [
  '2D',
  '3D',
  '2D3D',
  '4D',
  '3D4D',
] as const;

export type SequenceDigitProfile =
  | (typeof SEQUENCE_DIGIT_PROFILES)[number]
  | (string & {});

export interface SequenceDigitProfileOption {
  id: SequenceDigitProfile;
  digits: number[];
  labelVi: string;
  labelEn: string;
  descVi: string;
  descEn: string;
}

const MIN_SEQUENCE_DIGITS = 1;
const MAX_SEQUENCE_DIGITS = 12;

export function parseSequenceDigitList(profile: SequenceDigitProfile): number[] {
  const raw = String(profile ?? '').trim();
  const dMatches = Array.from(raw.matchAll(/(\d+)\s*D/gi)).map((m) => Number(m[1]));
  const numMatches =
    dMatches.length > 0
      ? dMatches
      : Array.from(raw.matchAll(/\d+/g)).map((m) => Number(m[0]));

  const normalized = Array.from(
    new Set(
      numMatches
        .filter((n) => Number.isFinite(n) && n >= MIN_SEQUENCE_DIGITS)
        .map((n) => Math.min(MAX_SEQUENCE_DIGITS, Math.max(MIN_SEQUENCE_DIGITS, Math.floor(n))))
    )
  );

  return normalized.length > 0 ? normalized : [2];
}

export function getSequenceDigitProfileOption(
  profile: SequenceDigitProfile
): SequenceDigitProfileOption {
  const id = String(profile ?? '').trim() || '2D';
  const digits = parseSequenceDigitList(id);

  const labelVi =
    digits.length === 1
      ? `${id} · ${digits[0]} chữ số`
      : digits.length === 2
      ? `${id} · ${digits[0]} chữ số và ${digits[1]} chữ số`
      : `${id} · ${digits.slice(0, -1).join(', ')} và ${digits[digits.length - 1]} chữ số`;

  const labelEn =
    digits.length === 1
      ? `${id} · ${digits[0]}-Digit`
      : `${id} · ${digits.slice(0, -1).join(', ')} & ${digits[digits.length - 1]}-Digit`;

  const descVi =
    digits.length === 1
      ? `${digits[0]} chữ số`
      : `${digits.slice(0, -1).join(', ')} & ${digits[digits.length - 1]} chữ số`;

  const descEn =
    digits.length === 1
      ? `${digits[0]}-digit`
      : `${digits.slice(0, -1).join(', ')} & ${digits[digits.length - 1]}-digit`;

  return {
    id,
    digits,
    labelVi,
    labelEn,
    descVi,
    descEn,
  };
}

export const SEQUENCE_DIGIT_PROFILE_OPTIONS: SequenceDigitProfileOption[] =
  SEQUENCE_DIGIT_PROFILES.map((profile) => getSequenceDigitProfileOption(profile));

export function getSequenceProfileDescVi(profile: SequenceDigitProfile): string {
  return getSequenceDigitProfileOption(profile).descVi;
}

export function getSequenceProfileDescEn(profile: SequenceDigitProfile): string {
  return getSequenceDigitProfileOption(profile).descEn;
}

export function getSequenceDigitBounds(digits: number): [number, number] {
  const safeDigits = Math.min(
    MAX_SEQUENCE_DIGITS,
    Math.max(MIN_SEQUENCE_DIGITS, Math.floor(digits))
  );
  if (safeDigits === 1) return [2, 9];
  return [Math.pow(10, safeDigits - 1), Math.pow(10, safeDigits) - 1];
}

export function getSequenceRootBounds(digits: number): [number, number] {
  const safeDigits = Math.min(
    MAX_SEQUENCE_DIGITS,
    Math.max(MIN_SEQUENCE_DIGITS, Math.floor(digits))
  );
  const minTarget = safeDigits === 1 ? 4 : Math.pow(10, safeDigits - 1);
  const maxTarget = Math.pow(10, safeDigits) - 1;

  let minRoot = Math.ceil(Math.sqrt(minTarget));
  let maxRoot = Math.floor(Math.sqrt(maxTarget));

  while (minRoot * minRoot < minTarget) minRoot++;
  while ((maxRoot + 1) * (maxRoot + 1) <= maxTarget) maxRoot++;
  while (maxRoot * maxRoot > maxTarget) maxRoot--;

  return [minRoot, Math.max(minRoot, maxRoot)];
}

export function getPercentageSequenceStartBounds(profile: SequenceDigitProfile): {
  initialDigits: number;
  startMin: number;
  startMax: number;
  startStep: number;
} {
  const digitsList = parseSequenceDigitList(profile);
  const initialDigits =
    digitsList[Math.floor(Math.random() * digitsList.length)] ?? 3;

  if (initialDigits === 1) {
    return { initialDigits, startMin: 2, startMax: 9, startStep: 1 };
  }
  if (initialDigits === 2) {
    return { initialDigits, startMin: 20, startMax: 99, startStep: 20 };
  }
  return {
    initialDigits,
    startMin: Math.pow(10, initialDigits - 1),
    startMax: Math.pow(10, initialDigits) - 1,
    startStep: 100,
  };
}

export function resolveSequenceDigitLengths(
  count: number,
  profile: SequenceDigitProfile,
  prioritizeLargestFirst = false
): number[] {
  const digits = parseSequenceDigitList(profile);
  const digitLengths: number[] = [];

  for (let i = 0; i < count; i++) {
    digitLengths.push(digits[i % digits.length]);
  }

  if (digits.length > 1) {
    for (let i = digitLengths.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digitLengths[i], digitLengths[j]] = [digitLengths[j], digitLengths[i]];
    }
    if (prioritizeLargestFirst && count === 2 && digitLengths[0] < digitLengths[1]) {
      [digitLengths[0], digitLengths[1]] = [digitLengths[1], digitLengths[0]];
    }
  }

  return digitLengths;
}
