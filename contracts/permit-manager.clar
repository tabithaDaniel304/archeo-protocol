;; permit-manager.clar

;; This contract manages permits for users to interact with other contracts.
;; It allows users to request permits, and contract owners to grant or revoke them.

(define-constant CONTRACT-OWNER tx-sender)

(define-constant ERR-NOT-CONTRACT-OWNER (err u100))
(define-constant ERR-PERMIT-NOT-FOUND (err u101))
(define-constant ERR-PERMIT-ALREADY-EXISTS (err u102))
(define-constant ERR-NOT-PERMITTED (err u103))
(define-constant ERR-INVALID-ARGUMENT (err u104))
(define-constant ERR-USER-NOT-REGISTERED (err u105))

;; Data Maps

;; permit-requests: Stores permit requests made by users.
;; Key: (user: principal, contract-id: principal, function-name: string)
;; Value: bool (true if requested, false otherwise)
(define-map permit-requests
  { user: principal, contract-id: principal, function-name: (string-ascii 256) }
  { requested: bool }
)

;; permits: Stores granted permits.
;; Key: (user: principal, contract-id: principal, function-name: string)
;; Value: bool (true if permitted, false otherwise)
(define-map permits
  { user: principal, contract-id: principal, function-name: (string-ascii 256) }
  { permitted: bool }
)

;; user-registry: Stores registered users.
;; Key: user: principal
;; Value: bool (true if registered, false otherwise)
(define-map user-registry
  { user: principal }
  { registered: bool }
)

;; Contract Functions

;; is-contract-owner: Checks if the caller is the contract owner.
(define-read-only (is-contract-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

;; request-permit: Allows a user to request a permit to call a function in a contract.
(define-public (request-permit (contract-id principal) (function-name (string-ascii 256)))
  (begin
    ;; Check if the user is registered
    (asserts! (default-to false (get registered (map-get? user-registry { user: tx-sender }))) (err ERR-USER-NOT-REGISTERED))
    ;; Check if the permit request already exists
    (if (is-some (map-get? permit-requests { user: tx-sender, contract-id: contract-id, function-name: function-name }))
      (err ERR-PERMIT-ALREADY-EXISTS)
      (ok (map-insert permit-requests { user: tx-sender, contract-id: contract-id, function-name: function-name } { requested: true }))
    )
  )
)

;; grant-permit: Allows the contract owner to grant a permit to a user.
(define-public (grant-permit (user principal) (contract-id principal) (function-name (string-ascii 256)))
  (begin
    ;; Check if the caller is the contract owner
    (asserts! (is-contract-owner) ERR-NOT-CONTRACT-OWNER)
    ;; Check if the permit request exists
    (asserts! (is-some (map-get? permit-requests { user: user, contract-id: contract-id, function-name: function-name })) ERR-PERMIT-NOT-FOUND)
    ;; Grant the permit
    (map-insert permits { user: user, contract-id: contract-id, function-name: function-name } { permitted: true })
    ;; Remove the permit request
    (map-delete permit-requests { user: user, contract-id: contract-id, function-name: function-name })
    (ok true)
  )
)

;; revoke-permit: Allows the contract owner to revoke a permit from a user.
(define-public (revoke-permit (user principal) (contract-id principal) (function-name (string-ascii 256)))
  (begin
    ;; Check if the caller is the contract owner
    (asserts! (is-contract-owner) ERR-NOT-CONTRACT-OWNER)
    ;; Check if the permit exists
    (asserts! (is-some (map-get? permits { user: user, contract-id: contract-id, function-name: function-name })) ERR-PERMIT-NOT-FOUND)
    ;; Revoke the permit
    (map-delete permits { user: user, contract-id: contract-id, function-name: function-name })
    (ok true)
  )
)

;; has-permit: Checks if a user has a permit to call a function in a contract.
(define-read-only (has-permit (user principal) (contract-id principal) (function-name (string-ascii 256)))
  (default-to { permitted: false } (map-get? permits { user: user, contract-id: contract-id, function-name: function-name }))
)

;; check-permit: Checks if the tx-sender has a permit to call a function in a contract.
;; This function is intended to be used internally by other contracts.
(define-read-only (check-permit (contract-id principal) (function-name (string-ascii 256)))
  (let ((permit (has-permit tx-sender contract-id function-name)))
    (if (get permitted permit)
      (ok true)
      (err ERR-NOT-PERMITTED)
    )
  )
)
