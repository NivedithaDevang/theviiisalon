-- Preserve booking snapshots while allowing the referenced service to be deleted.
ALTER TABLE bookings
  DROP FOREIGN KEY bookings_ibfk_2,
  MODIFY service_id INT NULL,
  ADD CONSTRAINT fk_bookings_service
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;