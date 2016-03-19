import Store from '../store/store';
import request from '../request/request';
import config from '../config/config';

class UserStore extends Store {
  name () {
    return 'user';
  }

  unban (id) {
    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(id)}/unban`)
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(item => {
            this.set(id, item);
            resolve(item);
          });
        });
    });

    return promise;
  }

  ban (id) {
    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(id)}/ban`)
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(item => {
            this.set(id, item);
            resolve(item);
          });
        });
    });

    return promise;
  }
}

export default new UserStore;
