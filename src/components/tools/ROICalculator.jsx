import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Table } from 'react-bootstrap';
import { saveToolData, getToolData } from '../../services/dataService';

const ROICalculator = ({ projectId }) => {
  const [formData, setFormData] = useState({
    implementationCosts: {
      training: 0,
      equipment: 0,
      consulting: 0,
      software: 0,
      otherCosts: 0,
    },
    projectedBenefits: {
      laborSavings: 0,
      materialSavings: 0,
      qualitySavings: 0,
      productivityGains: 0,
      otherBenefits: 0,
    },
    timeframe: 12, // months
  });
  
  const [results, setResults] = useState({
    totalCosts: 0,
    totalBenefits: 0,
    netBenefit: 0,
    roi: 0,
    paybackPeriod: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await getToolData(projectId, 'roiCalculator');
      if (data) {
        setFormData(data.formData || formData);
        setResults(data.results || results);
      }
    };
    loadData();
  }, [projectId]);

  const handleInputChange = (category, field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData({
      ...formData,
      [category]: {
        ...formData[category],
        [field]: numValue
      }
    });
  };

  const handleTimeframeChange = (value) => {
    setFormData({
      ...formData,
      timeframe: parseInt(value) || 12
    });
  };

  const calculateResults = () => {
    const totalCosts = Object.values(formData.implementationCosts).reduce((sum, val) => sum + val, 0);
    const monthlyBenefits = Object.values(formData.projectedBenefits).reduce((sum, val) => sum + val, 0);
    const totalBenefits = monthlyBenefits * formData.timeframe;
    const netBenefit = totalBenefits - totalCosts;
    const roi = totalCosts > 0 ? (netBenefit / totalCosts) * 100 : 0;
    const paybackPeriod = monthlyBenefits > 0 ? totalCosts / monthlyBenefits : 0;
    
    const newResults = {
      totalCosts,
      totalBenefits,
      netBenefit,
      roi,
      paybackPeriod
    };
    
    setResults(newResults);
    saveToolData(projectId, 'roiCalculator', {
      formData,
      results: newResults
    });
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Calculadora de ROI (Retorno de Inversión)</Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <h6>Costos de Implementación</h6>
            <Form.Group className="mb-3">
              <Form.Label>Entrenamiento</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.implementationCosts.training} 
                onChange={(e) => handleInputChange('implementationCosts', 'training', e.target.value)} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Equipamiento</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.implementationCosts.equipment} 
                onChange={(e) => handleInputChange('implementationCosts', 'equipment', e.target.value)} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Consultoría</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.implementationCosts.consulting} 
                onChange={(e) => handleInputChange('implementationCosts', 'consulting', e.target.value)} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Software</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.implementationCosts.software} 
                onChange={(e) => handleInputChange('implementationCosts', 'software', e.target.value)} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Otros Costos</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.implementationCosts.otherCosts} 
                onChange={(e) => handleInputChange('implementationCosts', 'otherCosts', e.target.value)} 
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <h6>Beneficios Proyectados (Mensual)</h6>
            <Form.Group className="mb-3">
              <Form.Label>Ahorro en Mano de Obra</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.projectedBenefits.laborSavings} 
                onChange={(e) => handleInputChange('projectedBenefits', 'laborSavings', e.target.value)} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ahorro en Materiales</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.projectedBenefits.materialSavings} 
                onChange={(e) => handleInputChange('projectedBenefits', 'materialSavings', e.target.value)} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ahorro en Calidad (Reducción de Defectos)</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.projectedBenefits.qualitySavings} 
                onChange={(e) => handleInputChange('projectedBenefits', 'qualitySavings', e.target.value)} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ganancias en Productividad</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.projectedBenefits.productivityGains} 
                onChange={(e) => handleInputChange('projectedBenefits', 'productivityGains', e.target.value)} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Otros Beneficios</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.projectedBenefits.otherBenefits} 
                onChange={(e) => handleInputChange('projectedBenefits', 'otherBenefits', e.target.value)} 
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Form.Group className="mb-3">
          <Form.Label>Período de Tiempo para Cálculo (meses)</Form.Label>
          <Form.Control 
            type="number" 
            value={formData.timeframe} 
            onChange={(e) => handleTimeframeChange(e.target.value)} 
          />
        </Form.Group>
        
        <Button variant="primary" onClick={calculateResults}>Calcular ROI</Button>
        
        <h5 className="mt-4">Resultados</h5>
        <Table striped bordered>
          <tbody>
            <tr>
              <td>Costos Totales</td>
              <td>${results.totalCosts.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Beneficios Totales</td>
              <td>${results.totalBenefits.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Beneficio Neto</td>
              <td>${results.netBenefit.toFixed(2)}</td>
            </tr>
            <tr>
              <td>ROI</td>
              <td>{results.roi.toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Período de Recuperación</td>
              <td>{results.paybackPeriod.toFixed(2)} meses</td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default ROICalculator;
