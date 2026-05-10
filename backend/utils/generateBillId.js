const generateBillId = () => {

  const date = new Date();

  const yyyy = date.getFullYear();

  const mm = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const dd = String(
    date.getDate()
  ).padStart(2, "0");

  const random =
    Math.floor(
      1000 + Math.random() * 9000
    );

  return `FRU-${yyyy}${mm}${dd}-${random}`;
};

module.exports = generateBillId;
