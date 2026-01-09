export const validateCNPJ = (cnpj: string): boolean => {
    const clean = cnpj.replace(/[^\d]/g, '');

    if (clean === '') return false;
    if (clean.length !== 14) return false;

    // Eliminate known invalid CNPJs
    if (/^(\d)\1+$/.test(clean)) return false;

    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    const digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
};

export const validateCPF = (cpf: string): boolean => {
    const clean = cpf.replace(/[^\d]/g, '');

    if (clean === '') return false;
    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++)
        sum = sum + parseInt(clean.substring(i - 1, i)) * (11 - i);

    remainder = (sum * 10) % 11;

    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(clean.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++)
        sum = sum + parseInt(clean.substring(i - 1, i)) * (12 - i);

    remainder = (sum * 10) % 11;

    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(clean.substring(10, 11))) return false;

    return true;
};

export const formatCNPJ = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 14) v = v.substring(0, 14);
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    return v;
}

export const formatCPF = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
}

export const formatLicensePlate = (v: string) => {
    // Remove all non-alphanumeric
    v = v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    // Limit to 7 chars
    if (v.length > 7) v = v.substring(0, 7);

    // Logic: 3 Letters + 4 chars.
    // Legacy: LLLNNNN -> LLL-NNNN
    // Mercosul: LLLNLNN -> LLL NLNN

    if (v.length > 3) {
        const letters = v.substring(0, 3);
        const rest = v.substring(3);

        // Check 4th char (index 3 of original, 0 of rest) -> Should be number
        // Check 5th char (index 4 of original, 1 of rest) -> 
        // If Number -> Legacy -> Hyphen
        // If Letter -> Mercosul -> Space (as per user example)

        if (rest.length >= 2) {
            const char5 = rest.charAt(1);
            if (/[0-9]/.test(char5)) {
                // Legacy
                return letters + '-' + rest;
            } else {
                // Mercosul (assuming char5 is letter)
                // Or just mixed. User asked for "ABC 1C34"
                return letters + ' ' + rest;
            }
        }

        // If haven't typed 5th char yet, assumption based on 4th or just waiting?
        // Default to hyphen if ambiguous? Or no separator until confirmed?
        // Let's stick to hypen for standard view until it breaks pattern?
        return letters + '-' + rest;
    }

    return v;
}

export const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};
