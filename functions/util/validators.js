const isEmpty = (string) => {
  if(string.trim() === "") return true;
  else return false;
}

const isEmail = (email) => {
  // const regEX = /[a]/
  if(email !== "") return true;
  else return false;
}