import { Card } from '@components/common/Card';
import { Badge } from '@components/common/Badge';
import { Calendar, Users, CheckCircle } from 'lucide-react';

export const Dashboard = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: '600' }}>
        Dashboard
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #0047AB, #00A6D6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Calendar size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6C757D', marginBottom: '0.25rem' }}>
                Événements
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#212529' }}>
                12
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #28A745, #20C997)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6C757D', marginBottom: '0.25rem' }}>
                Participants
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#212529' }}>
                340
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #17A2B8, #0056B3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6C757D', marginBottom: '0.25rem' }}>
                Taux de présence
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#212529' }}>
                87%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Card header="Événements à venir">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8F9FA', borderRadius: '0.5rem' }}>
              <div>
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Formation Blockchain</p>
                <p style={{ fontSize: '0.875rem', color: '#6C757D' }}>30 décembre 2025, 9h00</p>
              </div>
              <Badge variant="success">45 inscrits</Badge>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8F9FA', borderRadius: '0.5rem' }}>
              <div>
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Atelier Data Science</p>
                <p style={{ fontSize: '0.875rem', color: '#6C757D' }}>5 janvier 2026, 14h00</p>
              </div>
              <Badge variant="warning">12 inscrits</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};