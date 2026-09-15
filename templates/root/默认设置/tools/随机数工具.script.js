const min = Math.ceil(input.min);
const max = Math.floor(input.max);
return Math.floor(Math.random() * (max - min + 1)) + min;
