from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
import uuid

from .session import Base

class UserSQL(Base):
    __tablename__ = "accounts_user"

    employee_id = Column(String(20), primary_key=True)  # UUID로 변경시 수정 필요
    name = Column(String(100))
    department = Column(String(100))
    role = Column(String(10))
    openmrs_uuid = Column(String(36), unique=True, nullable=True)

    # OpenMRSPatient 역참조 (OneToOne이므로 uselist=False)
    openmrs_patient = relationship(
        "OpenMRSPatientSQL",
        back_populates="user",
        uselist=False
    )

    def __repr__(self):
        return f"<UserSQL(employee_id='{self.employee_id}', name='{self.name}')>"
