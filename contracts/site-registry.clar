;; site-registry.clar
;; contract to manage registered sites

(define-constant CONTRACT-OWNER tx-sender)

(define-data-var site-count uint u0)

(define-map site-details
  { site-id: uint }
  {
    owner: principal,
    name: (string-ascii 256),
    description: (string-ascii 256),
    url: (string-ascii 256),
    image: (string-ascii 256),
    category: (string-ascii 256)
  }
)

(define-read-only (get-site-count)
  (var-get site-count)
)

(define-read-only (get-site-details (site-id uint))
  (map-get? site-details { site-id: site-id })
)

(define-public (register-site
    (name (string-ascii 256))
    (description (string-ascii 256))
    (url (string-ascii 256))
    (image (string-ascii 256))
    (category (string-ascii 256)))
  (let (
        (new-site-id (+ u1 (var-get site-count)))
       )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) err-unauthorized)
    (map-insert site-details
      { site-id: new-site-id }
      {
        owner: tx-sender,
        name: name,
        description: description,
        url: url,
        image: image,
        category: category
      }
    )
    (var-set site-count new-site-id)
    (ok new-site-id)
  )
)

(define-public (update-site
    (site-id uint)
    (name (string-ascii 256))
    (description (string-ascii 256))
    (url (string-ascii 256))
    (image (string-ascii 256))
    (category (string-ascii 256)))
  (let (
       (site (unwrap! (map-get? site-details { site-id: site-id }) err-not-found))
       )
    (asserts! (is-eq tx-sender (get owner site)) err-unauthorized)
    (map-insert site-details
      { site-id: site-id }
      {
        owner: tx-sender,
        name: name,
        description: description,
        url: url,
        image: image,
        category: category
      }
    )
    (ok true)
  )
)

(define-public (delete-site (site-id uint))
  (let (
       (site (unwrap! (map-get? site-details { site-id: site-id }) err-not-found))
       )
    (asserts! (is-eq tx-sender (get owner site)) err-unauthorized)
    (map-delete site-details { site-id: site-id })
    (ok true)
  )
)

(define-constant err-unauthorized (err u1000))
(define-constant err-not-found (err u1001))
