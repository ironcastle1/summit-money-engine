export function customerSegment(input = {}) { const annual = Number(input.annualValueMinor || 0); const seats = Number(input.seats || 1); if (input.strategic || annual >= 12000000)
    return 'STRATEGIC'; if (annual >= 1200000 || seats >= 50)
    return 'ENTERPRISE'; if (annual >= 300000 || seats >= 15)
    return 'MID_MARKET'; if (annual >= 60000 || seats >= 3)
    return 'SMB'; return 'SELF_SERVE'; }
