const FIDO2_SERVER = ""; // https://admin-auth.ofido.tw
const API_SERVER = "";

const bufferDecode = (value) => {
  let str = value.replace(/-/g, "+").replace(/_/g, "/");

  while (str.length % 4 !== 0) {
    str += "=";
  }

  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
};

const binToStr = (bin) =>
  btoa(
    new Uint8Array(bin).reduce((s, byte) => s + String.fromCharCode(byte), "")
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const unwrapPublicKeyCredential = (cred) => {
  let r = {
    response: {},
  };

  if ("id" in cred) r.id = cred.id;
  if ("type" in cred) r.type = cred.type;
  if ("rawId" in cred) r.rawId = binToStr(cred.rawId);
  if ("response" in cred) {
    // Used in registration
    if ("clientDataJSON" in cred.response)
      r.response.clientDataJSON = binToStr(cred.response.clientDataJSON);
    if ("attestationObject" in cred.response)
      r.response.attestationObject = binToStr(
        cred.response.attestationObject
      );
    // Used in authentication
    if ("authenticatorData" in cred.response)
      r.response.authenticatorData = binToStr(
        cred.response.authenticatorData
      );
    if ("signature" in cred.response)
      r.response.signature = binToStr(cred.response.signature);
    if ("userHandle" in cred.response)
      r.response.userHandle = binToStr(cred.response.userHandle);
  }

  return r;
};

const login = async () => {
  try {
    const { publicKey } = await fetch(
      `${FIDO2_SERVER}/api/webauthn/user/authentication/initialize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "transaction": ""
        }),
        mode: "cors",
      }
    ).then((res) => res.json());

    publicKey.challenge = bufferDecode(publicKey.challenge);

    const resp = await navigator.credentials.get({
      publicKey
    });

    const { data } = await fetch(`${FIDO2_SERVER}/api/webauthn/user/authentication/finalize`, {
      method: "POST",
      body: JSON.stringify(unwrapPublicKeyCredential(resp)),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(res => res.json());

    console.log(data);
  } catch (err) {
    console.log(err);
  }
};

const register = async () => {
  try {
    const email = emailInputRef.current.value;
    registerBtnRef.current;

    if (emailInputRef.current.style.display === "none") {
      emailInputRef.current.style.display = "inline";
    } else {
      const { token } = await fetch(
        `${API_SERVER}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
          mode: "cors",
        }
      ).then((res) => res.json());

      const { publicKey } = await fetch(
        `${FIDO2_SERVER}/api/webauthn/user/registration/initialize`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          mode: "cors",
        }
      ).then((res) => res.json());

      publicKey.challenge = bufferDecode(publicKey.challenge);
      publicKey.user.id = bufferDecode(publicKey.user.id);

      if (publicKey.excludeCredentials) {
        for (var i = 0; i < publicKey.excludeCredentials.length; i++) {
          publicKey.excludeCredentials[i].id = bufferDecode(
            publicKey.excludeCredentials[i].id
          );
        }
      }

      const credential = await navigator.credentials.create({
        publicKey,
      });

      await fetch(
        `${FIDO2_SERVER}/api/webauthn/user/registration/finalize`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          mode: "cors",
          body: JSON.stringify(unwrapPublicKeyCredential(credential)),
        }
      ).then((res) => res.json());
    }
  } catch (err) {
    console.log(err);
  }
};