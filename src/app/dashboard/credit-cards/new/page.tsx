<Input
  id="dueDay"
  name="dueDay"
  value={creditCard.dueDay}
  onChange={(e) => {
    // Permite campo vazio ou números entre 1 e 31
    const value = e.target.value;
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
      setCreditCard({ ...creditCard, dueDay: value === '' ? '' : parseInt(value) });
    }
  }}
  type="number"
  min="1"
  max="31"
  placeholder="Dia do vencimento"
  required
/>

<Input
  id="closingDay"
  name="closingDay"
  value={creditCard.closingDay}
  onChange={(e) => {
    // Permite campo vazio ou números entre 1 e 31
    const value = e.target.value;
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
      setCreditCard({ ...creditCard, closingDay: value === '' ? '' : parseInt(value) });
    }
  }}
  type="number"
  min="1"
  max="31"
  placeholder="Dia do fechamento"
  required
/> 