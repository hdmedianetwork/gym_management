import React, { useState, useEffect } from 'react';
import { Modal, Card, Button, Form, Input, Select, message } from 'antd';
import { TagOutlined, PlusOutlined, EditOutlined, DeleteOutlined, PercentageOutlined } from '@ant-design/icons';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../utils/api';

const { Option } = Select;

const CouponOverlay = ({ visible, onClose }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [showEditCouponModal, setShowEditCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modal, modalContextHolder] = Modal.useModal();

  useEffect(() => {
    if (visible) {
      fetchCoupons();
    }
  }, [visible]);

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
      discountType: coupon.discountType || 'amount', // fallback for old coupons
      discountValue: parseFloat(coupon.discount)
    });
    setShowEditCouponModal(true);
  };

  const formatDiscount = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return (
        <span className="flex items-center gap-1">
          <PercentageOutlined className="text-green-600" />
          {coupon.discount}%
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1">
          ₹{coupon.discount}
        </span>
      );
    }
  };

  return (
    <>
      {modalContextHolder}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <TagOutlined className="text-orange-600" />
            <span className="text-xl font-semibold text-gray-900">Coupon Codes Management</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
        className="[&_.ant-modal-content]:p-0 [&_.ant-modal-header]:p-4 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-body]:p-6"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Coupon Codes Management</h3>
              {coupons.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  Total: {coupons.length} coupons available
                </div>
              )}
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowAddCouponModal(true)}
              className="shrink-0"
            >
              Add Coupon
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon, index) => (
              <Card
                key={coupon._id || index}
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 rounded-lg relative"
                onClick={() => openEditModal(coupon)}
                styles={{ body: { padding: '20px' } }}
              >
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(coupon);
                    }}
                    className="hover:bg-blue-50 hover:text-blue-600"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCoupon(coupon._id);
                    }}
                    className="hover:bg-red-50 hover:text-red-600"
                  />
                </div>

                <div className="text-center space-y-3 group">
                  <div className="text-3xl p-3 bg-orange-50 text-orange-500 rounded-full mx-auto w-fit">
                    <TagOutlined />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 font-mono">
                      {coupon.code}
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-center items-center">
                        <span className="text-xl font-bold text-green-600">
                          {formatDiscount(coupon)}
                        </span>
                      </div>
                      
                      <div className="text-gray-500 text-xs">
                        {coupon.discountType === 'percentage' ? 'Percentage Discount' : 'Fixed Amount Discount'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {coupons.length === 0 && !loading && (
            <div className="text-center py-12">
              <TagOutlined className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No coupons available</p>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setShowAddCouponModal(true)}
                className="mt-4"
              >
                Create Your First Coupon
              </Button>
            </div>
          )}
        </div>
      </Modal>

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
        className="[&_.ant-modal-content]:p-0 [&_.ant-modal-header]:p-4 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-body]:p-6"
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
        className="[&_.ant-modal-content]:p-0 [&_.ant-modal-header]:p-4 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-body]:p-6"
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

export default CouponOverlay;