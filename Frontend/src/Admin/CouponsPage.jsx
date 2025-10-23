import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, message, Modal } from 'antd';
import { TagOutlined, PlusOutlined, EditOutlined, DeleteOutlined, PercentageOutlined } from '@ant-design/icons';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../utils/api';

const { Option } = Select;

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [showEditCouponModal, setShowEditCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modal, modalContextHolder] = Modal.useModal();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getAllCoupons();
      setCoupons(response || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      message.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (values) => {
    try {
      const { code, discountType, discountValue } = values;
      const discount = discountValue.toString();
      
      const created = await createCoupon({ code, discount, discountType });
      message.success('Coupon created successfully');
      modal.success({
        title: 'Coupon Created',
        content: (
          <div>
            <p><strong>Code:</strong> {created?.code}</p>
            <p><strong>Discount:</strong> {created?.discount}{created?.discountType === 'percentage' ? '%' : ''}</p>
            <p><strong>Type:</strong> {created?.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</p>
          </div>
        ),
      });
      setShowAddCouponModal(false);
      form.resetFields();
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      message.error('Failed to create coupon');
    }
  };

  const handleEditCoupon = async (values) => {
    try {
      const { code, discountType, discountValue } = values;
      const discount = discountValue.toString();
      
      await updateCoupon(editingCoupon._id, { code, discount, discountType });
      message.success('Coupon updated successfully');
      setShowEditCouponModal(false);
      editForm.resetFields();
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon:', error);
      message.error('Failed to update coupon');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    try {
      if (window.confirm('Are you sure you want to delete this coupon?')) {
        await deleteCoupon(couponId);
        message.success('Coupon deleted successfully');
        if (showEditCouponModal) {
          setShowEditCouponModal(false);
          setEditingCoupon(null);
        }
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      message.error('Failed to delete coupon');
    }
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    
    editForm.setFieldsValue({
      code: coupon.code,
      discountType: coupon.discountType || 'amount',
      discountValue: parseFloat(coupon.discount)
    });
    setShowEditCouponModal(true);
  };

  const formatDiscount = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return (
        <span className="flex items-center justify-center gap-1">
          <PercentageOutlined className="text-green-400" />
          {coupon.discount}%
        </span>
      );
    } else {
      return (
        <span className="flex items-center justify-center gap-1">
          ₹{coupon.discount}
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {modalContextHolder}
      <div className="min-h-screen p-6 bg-white text-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TagOutlined className="text-3xl text-orange-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
                  {coupons.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Total: {coupons.length} coupons available
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowAddCouponModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <PlusOutlined />
                <span>Add Coupon</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon, index) => (
                <Card
                  key={coupon._id || index}
                  className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 rounded-xl bg-white relative group"
                  onClick={() => openEditModal(coupon)}
                  styles={{ body: { padding: '24px' } }}
                >
                  <div className="absolute top-3 right-3 flex gap-1">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(coupon);
                      }}
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCoupon(coupon._id);
                      }}
                      className="text-red-600 hover:bg-red-50"
                    />
                  </div>

                  <div className="text-center space-y-4">
                    <div className="text-4xl p-4 bg-orange-50 text-orange-600 rounded-full mx-auto w-fit">
                      <TagOutlined />
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-3 font-mono tracking-wider">
                        {coupon.code}
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-green-600">
                          {formatDiscount(coupon)}
                        </div>
                        
                        <div className="text-gray-600 text-xs">
                          {coupon.discountType === 'percentage' ? 'Percentage Discount' : 'Fixed Amount Discount'}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {coupons.length === 0 && !loading && (
              <div className="text-center py-20">
                <TagOutlined className="text-8xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-xl">No coupons available</p>
                <button
                  onClick={() => setShowAddCouponModal(true)}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors mx-auto"
                >
                  <PlusOutlined />
                  <span>Create Your First Coupon</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Coupon Modal */}
      <Modal
        title="Add New Coupon"
        open={showAddCouponModal}
        onCancel={() => {
          setShowAddCouponModal(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddCoupon}
          className="space-y-4"
        >
          <Form.Item
            label="Coupon Code"
            name="code"
            rules={[{ required: true, message: 'Please enter coupon code' }]}
          >
            <Input 
              placeholder="e.g., GYMFIT100, SAVE20" 
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </Form.Item>
          
          <Form.Item
            label="Discount Type"
            name="discountType"
            rules={[{ required: true, message: 'Please select discount type' }]}
          >
            <Select placeholder="Select discount type">
              <Option value="percentage">Percentage (%)</Option>
              <Option value="amount">Fixed Amount (₹)</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="Discount Value"
            name="discountValue"
            rules={[{ required: true, message: 'Please enter discount value' }]}
          >
            <Input
              type="number"
              placeholder="e.g., 20 for 20% or 100 for ₹100"
              min={1}
            />
          </Form.Item>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => {
              setShowAddCouponModal(false);
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Coupon
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Coupon Modal */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {editingCoupon && (
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteCoupon(editingCoupon._id)}
                  title="Delete Coupon"
                />
              )}
              <span>Edit Coupon</span>
            </div>
          </div>
        }
        open={showEditCouponModal}
        onCancel={() => {
          setShowEditCouponModal(false);
          editForm.resetFields();
          setEditingCoupon(null);
        }}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditCoupon}
          className="space-y-4"
        >
          <Form.Item
            label="Coupon Code"
            name="code"
            rules={[{ required: true, message: 'Please enter coupon code' }]}
          >
            <Input 
              placeholder="e.g., GYMFIT100, SAVE20" 
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </Form.Item>
          
          <Form.Item
            label="Discount Type"
            name="discountType"
            rules={[{ required: true, message: 'Please select discount type' }]}
          >
            <Select placeholder="Select discount type">
              <Option value="percentage">Percentage (%)</Option>
              <Option value="amount">Fixed Amount (₹)</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="Discount Value"
            name="discountValue"
            rules={[{ required: true, message: 'Please enter discount value' }]}
          >
            <Input
              type="number"
              placeholder="e.g., 20 for 20% or 100 for ₹100"
              min={1}
            />
          </Form.Item>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => {
              setShowEditCouponModal(false);
              editForm.resetFields();
              setEditingCoupon(null);
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Update Coupon
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default CouponsPage;
