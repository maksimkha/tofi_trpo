async function set_names(){
    user = firebase.auth().currentUser;
    friends = []
    await firebase.database().ref("users/" + user.uid + "/friends").once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            friends.push(childSnapshot.val().name);
        });
    }).catch((error) => {
        console.error(error);
    });
    options = '';
    datalists = document.getElementsByName("user_datalist");
    for (j = 1; j <= datalists.length; j++){
        options = '';
        console.log("setting items for friends" + j);
        for (i = 0; i < friends.length; i++) {
            options += '<option value="' + friends[i] + '" />';
        }
        document.getElementById('friends'+j).innerHTML = options;
    }
}

function on_load(){
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        lang = ""
        firebase.database().ref("users/" + user.uid + "/language").once('value', (snapshot) => {
          if (snapshot.exists()) {
            lang = snapshot.val();
            location.href = snapshot.val();
            if (snapshot.val() == "#ru" && document.getElementById("account").text == "Account"){ 
              location.reload();
            }
            else if (snapshot.val() == "#en" && document.getElementById("account").text == "Аккаунт"){
              location.reload();
            }
          } else {
            console.log("no lang written");
          }
        }).catch((error) => {
          console.error(error);
        });
        item_id = new URLSearchParams(window.location.search).get("id");
        bool_photo = true;
        firebase.database().ref("users/" + user.uid + "/owes/" + item_id).once('value', (snapshot) => {
          data = snapshot.val();
          names = document.getElementsByName("user_name");
          amounts = document.getElementsByName("user_amount");
          document.getElementById("event").value = data.event;
          document.getElementById(data.category).selected=true;
          document.getElementById(data.method).selected=true;
          document.getElementById("amount").value = data.amount;
          bool_photo = data.photo
          if (bool_photo){
            firebase.storage().ref("users/" + user.uid + "/owes/").child(item_id).getDownloadURL().then(function(url){
              document.getElementById("photo").src = url;
              console.log("hooray");
            }).catch(function(error) {
              console.error(error);
            });
          }
          i = 0;
          for (const [key, value] of Object.entries(data.owes)) {
            if (i > 1){
              div = document.createElement('div');
              div.className = "page-form__line-container"
              div.innerHTML = "<input list='friends" + i +"' name='user_name' readonly autocomplete='off'/><datalist id='friends" + i +"' name='user_datalist'></datalist><label>-</label><input name='user_amount' type='number' value=0 readonly>"
              btn_line = document.getElementById("btn_line");
              form = document.getElementById("page-form");
              form.insertBefore(div, btn_line);
            }
            names[i].value = key;
            amounts[i].value = value;
            i++;
          }
          set_names();
        });
      } else {
        console.log("hey, leave this page!");
      }
    });
    if (window.location.hash){
        console.log(window.location.hash);
        if (window.location.hash == "#ru"){
          document.getElementById("togBtn").checked = true;
          document.getElementById("account").text = language.ru.account;
          document.getElementById("owe_h").innerHTML = language.ru.owe_page;
          document.getElementById("event_label").innerHTML = language.ru.event;
          document.getElementById("category_label").innerHTML = language.ru.category;
          document.getElementById("check_amount_label").innerHTML = language.ru.owe_page;
          document.getElementById("photo_label").innerHTML = language.ru.owe_page;
          document.getElementById("method_label").innerHTML = language.ru.method;
          document.getElementById("edit_btn").innerHTML = language.ru.edit;
          document.getElementById("delete_btn").innerHTML = language.ru.delete;
          change_category_options('ru');
        }
        else{
          document.getElementById("togBtn").checked = false;
          document.getElementById("account").text = language.en.account;
          document.getElementById("owe_h").innerHTML = language.en.owe_page;
          document.getElementById("event_label").innerHTML = language.en.event;
          document.getElementById("category_label").innerHTML = language.en.category;
          document.getElementById("check_amount_label").innerHTML = language.en.check_amount;
          document.getElementById("photo_label").innerHTML = language.en.photo;
          document.getElementById("method_label").innerHTML = language.en.method;
          document.getElementById("edit_btn").innerHTML = language.en.edit;
          document.getElementById("delete_btn").innerHTML = language.en.delete;
          change_category_options('en');
        }
    }
}

function delete_item(){
    user = firebase.auth().currentUser;
    item_id = new URLSearchParams(window.location.search).get("id");
    firebase.database().ref("users/" + user.uid + "/owes/" + item_id).remove();
    firebase.storage().ref("users/" + user.uid + "/owes/").child(item_id).delete();
    window.location.href = "index.html";
}

async function edit_item(){
    user = firebase.auth().currentUser;
    item_id = new URLSearchParams(window.location.search).get("id");
    btn = document.getElementById("edit_btn");
    names = document.getElementsByName("user_name");
    amounts = document.getElementsByName("user_amount");
    if (btn.textContent == language.en.edit || btn.textContent == language.ru.edit){
      if (btn.textContent == language.en.edit){
        btn.textContent = language.en.save;
      }
      else if (btn.textContent == language.ru.edit){
        btn.textContent = language.ru.save;
      }
      document.getElementById("addition").disabled = false;
      document.getElementById("delete").disabled = false;
      document.getElementById("event").readOnly = false;
      document.getElementById("category").disabled = false;
      document.getElementById("amount").readOnly = false;
      document.getElementById("method").disabled = false;
      for (i = 0; i < names.length; i++){
        names[i].readOnly = false;
        amounts[i].readOnly = false;
      }
    }
    else{
      medium_amount = document.getElementById("amount").value / (names.length);
      sum = document.getElementById("amount").value;
      dict = {};
      for (i = 0; i < names.length; i++){
        dict[names[i].value] = amounts[i].value;
        sum -= amounts[i].value;
      }
      if (sum != 0){
          return false;
      }
      sign = '';
      if (amounts[0].value > medium_amount){
        sign = '+';
      }
      else{
        sign = '-';
      }
      category_opt = document.getElementById("category")
      method_opt = document.getElementById("method")
      firebase.database().ref("users/" + user.uid + "/owes/" + item_id).set({
        event: document.getElementById("event").value,
        category: category_opt.options[category_opt.selectedIndex].id,
        amount: document.getElementById("amount").value,
        method: method_opt.options[method_opt.selectedIndex].id,
        owes: dict,
        sign: sign,
        difference: Math.abs(medium_amount - amounts[0].value)
      });
      console.log("saving friends");
      friends = []
      for (i = 1; i < names.length; i++){
        friends.push(names[i].value);
      }
      await firebase.database().ref("users/" + user.uid + "/friends").once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            friends = friends.filter(function(e) { return e !== childSnapshot.val().name })
        });
      }).catch((error) => {
        console.error(error);
      });
      console.log(friends)
      for (i = 0; i < friends.length; i++){
        await firebase.database().ref('users/'+ user.uid + '/friends').push({
            name: friends[i]
        })
      }
      window.location.href = "index.html";
    }
  }

  function paid_method() {
    method = document.getElementById("method").value;
    names = document.getElementsByName("user_name");
    amounts = document.getElementsByName("user_amount");
    if (btn.textContent == language.en.save || btn.textContent == language.ru.save){
      if (method == "Equal" || method == "Поравну"){
        medium_amount = document.getElementById("amount").value / (names.length);
        for (i = 0; i < amounts.length; i++){
          amounts[i].value = medium_amount;
          amounts[i].readOnly = true;
        }
      }
      else if (method == "Amounts" || method == "Величины"){
        for (i = 0; i < amounts.length; i++){
          amounts[i].readOnly = false;
        }
      }
    }
  }

  function change_category_options(lang){
    cat_select = document.getElementById("category");
    met_select = document.getElementById("method");
    if (lang == 'en'){
      ans = language.en.category_opt;
      methods = language.en.method_opt;
    }
    else{
      ans = language.ru.category_opt;
      methods = language.ru.method_opt;
    }
    i = 0
    for (const [key, value] of Object.entries(ans)) {
      cat_select.options[i].innerText = value;
      i++;
    }
    i = 0
    for (const [key, value] of Object.entries(methods)) {
      met_select.options[i].innerText = value;
      i++;
    }
  }

  function set_medium(){
    method = document.getElementById("method").value;
    names = document.getElementsByName("user_name");
    amounts = document.getElementsByName("user_amount");
    if (method == "Equal"){
      medium_amount = document.getElementById("amount").value / (names.length);
      for (i = 0; i < amounts.length; i++){
        amounts[i].value = medium_amount;
      }
    }
}

function add_input() {
    names = document.getElementsByName("user_name");
    number = names.length - 1
    method = document.getElementById("method").value;
    div = document.createElement('div');
    div.className = "page-form__line-container"
    if (method == "Equal"){
        div.innerHTML = "<input list='friends" + number +"' name='user_name' autocomplete='off'/><datalist id='friends" + number +"' name='user_datalist'></datalist><label>-</label><input name='user_amount' type='number' value=0 readonly>"
    }
    else{
        div.innerHTML = "<input list='friends" + number +"' name='user_name' autocomplete='off'/><datalist id='friends" + number +"' name='user_datalist'></datalist><label>-</label><input name='user_amount' type='number'>"
    }
    btn_line = document.getElementById("btn_line");
    form = document.getElementById("page-form");
    form.insertBefore(div, btn_line);
    set_medium();
}

function delete_input() {
    divs = document.getElementsByClassName("page-form__line-container");
    to_del = divs[divs.length - 2];
    if (divs.length > 9)
      to_del.remove();
    names = document.getElementsByName("user_name");
    amounts = document.getElementsByName("user_amount");
    if (method == "Equal"){
      medium_amount = document.getElementById("amount").value / (names.length);
      for (i = 0; i < amounts.length; i++){
        amounts[i].value = medium_amount;
      }
    }
}