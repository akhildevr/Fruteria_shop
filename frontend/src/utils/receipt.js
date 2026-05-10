export const generateReceipt = (
  bill,
  cart,
  mobile
) => {

  const date = new Date();

  return `
================================
          FRUTERIA
================================

Date : ${date.toLocaleDateString()}
Time : ${date.toLocaleTimeString()}

Mobile : ${mobile || "Guest"}

--------------------------------
Item            Qty     Price
--------------------------------

${cart.map(item => `
${item.name}
  ${item.qty} x ${item.price}
`).join("")}

--------------------------------

Total Items : ${
  cart.reduce(
    (a, b) => a + b.qty,
    0
  )
}

Subtotal : ₹${bill.subtotal || bill.finalTotal + (bill.discount || 0)}

Discount : ₹${bill.discount || 0}

Reward : +${bill.rewardPoints || 0}

--------------------------------

Final Total : ₹${bill.finalTotal}

================================
     THANK YOU VISIT AGAIN
================================
`;
};