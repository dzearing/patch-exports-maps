import globInternal from 'glob';

export async function glob(match, options) {
  return new Promise((resolve, reject) => {
    globInternal(match, options, (err, matches) => {
      if (err) {
        reject(err);
      } else {
        resolve(matches);
      }
    });
  })
}
